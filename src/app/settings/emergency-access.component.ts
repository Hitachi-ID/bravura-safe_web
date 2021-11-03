import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ToasterService } from 'angular2-toaster';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { EmergencyAccessStatusType } from 'jslib-common/enums/emergencyAccessStatusType';
import { EmergencyAccessType } from 'jslib-common/enums/emergencyAccessType';
import { Utils } from 'jslib-common/misc/utils';
import { EmergencyAccessConfirmRequest } from 'jslib-common/models/request/emergencyAccessConfirmRequest';
import { EmergencyAccessGranteeDetailsResponse, EmergencyAccessGrantorDetailsResponse } from 'jslib-common/models/response/emergencyAccessResponse';
import { ConstantsService } from 'jslib-common/services/constants.service';

import { UserNamePipe } from 'jslib-angular/pipes/user-name.pipe';

import { ModalComponent } from '../modal.component';
import { EmergencyAccessAddEditComponent } from './emergency-access-add-edit.component';
import { EmergencyAccessConfirmComponent } from './emergency-access-confirm.component';
import { EmergencyAccessTakeoverComponent } from './emergency-access-takeover.component';

@Component({
    selector: 'emergency-access',
    templateUrl: 'emergency-access.component.html',
})
export class EmergencyAccessComponent implements OnInit {
    @ViewChild('addEdit', { read: ViewContainerRef, static: true }) addEditModalRef: ViewContainerRef;
    @ViewChild('takeoverTemplate', { read: ViewContainerRef, static: true}) takeoverModalRef: ViewContainerRef;
    @ViewChild('confirmTemplate', { read: ViewContainerRef, static: true }) confirmModalRef: ViewContainerRef;

    canAccessPremium: boolean;
    trustedContacts: EmergencyAccessGranteeDetailsResponse[];
    grantedContacts: EmergencyAccessGrantorDetailsResponse[];
    emergencyAccessType = EmergencyAccessType;
    emergencyAccessStatusType = EmergencyAccessStatusType;
    actionPromise: Promise<any>;
    isOrganizationOwner: boolean;

    private modal: ModalComponent = null;

    constructor(private apiService: ApiService, private i18nService: I18nService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private platformUtilsService: PlatformUtilsService,
        private toasterService: ToasterService, private cryptoService: CryptoService,
        private storageService: StorageService, private userService: UserService,
        private messagingService: MessagingService, private userNamePipe: UserNamePipe) { }

    async ngOnInit() {
        this.canAccessPremium = await this.userService.canAccessPremium();
        const orgs = await this.userService.getAllOrganizations();
        this.isOrganizationOwner = orgs.some(o => o.isOwner);
        this.load();
    }

    async load() {
        this.trustedContacts = (await this.apiService.getEmergencyAccessTrusted()).data;
        this.grantedContacts = (await this.apiService.getEmergencyAccessGranted()).data;
    }

    async premiumRequired() {
        if (!this.canAccessPremium) {
            this.messagingService.send('premiumRequired');
            return;
        }
    }

    edit(details: EmergencyAccessGranteeDetailsResponse) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.addEditModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<EmergencyAccessAddEditComponent>(
            EmergencyAccessAddEditComponent, this.addEditModalRef);

        childComponent.name = this.userNamePipe.transform(details);
        childComponent.emergencyAccessId = details?.id;
        childComponent.readOnly = !this.canAccessPremium;
        childComponent.onSaved.subscribe(() => {
            this.modal.close();
            this.load();
        });
        childComponent.onDeleted.subscribe(() => {
            this.modal.close();
            this.remove(details);
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    invite() {
        this.edit(null);
    }

    async reinvite(contact: EmergencyAccessGranteeDetailsResponse) {
        if (this.actionPromise != null) {
            return;
        }
        this.actionPromise = this.apiService.postEmergencyAccessReinvite(contact.id);
        await this.actionPromise;
        this.toasterService.popAsync('success', null, this.i18nService.t('hasBeenReinvited', contact.email));
        this.actionPromise = null;
    }

    async confirm(contact: EmergencyAccessGranteeDetailsResponse) {
        function updateUser() {
            contact.status = EmergencyAccessStatusType.Confirmed;
        }

        if (this.actionPromise != null) {
            return;
        }

        const autoConfirm = await this.storageService.get<boolean>(ConstantsService.autoConfirmFingerprints);
        if (autoConfirm == null || !autoConfirm) {
            if (this.modal != null) {
                this.modal.close();
            }

            const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
            this.modal = this.confirmModalRef.createComponent(factory).instance;
            const childComponent = this.modal.show<EmergencyAccessConfirmComponent>(
                EmergencyAccessConfirmComponent, this.confirmModalRef);

            childComponent.name = this.userNamePipe.transform(contact);
            childComponent.emergencyAccessId = contact.id;
            childComponent.userId = contact?.granteeId;
            childComponent.onConfirmed.subscribe(async () => {
                this.modal.close();

                childComponent.formPromise = this.doConfirmation(contact);
                await childComponent.formPromise;

                updateUser();
                this.toasterService.popAsync('success', null, this.i18nService.t('hasBeenConfirmed', this.userNamePipe.transform(contact)));
            });

            this.modal.onClosed.subscribe(() => {
                this.modal = null;
            });
            return;
        }

        this.actionPromise = this.doConfirmation(contact);
        await this.actionPromise;
        updateUser();

        this.toasterService.popAsync('success', null, this.i18nService.t('hasBeenConfirmed', this.userNamePipe.transform(contact)));
        this.actionPromise = null;
    }

    async remove(details: EmergencyAccessGranteeDetailsResponse | EmergencyAccessGrantorDetailsResponse) {
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('removeUserConfirmation'), this.userNamePipe.transform(details),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return false;
        }

        try {
            await this.apiService.deleteEmergencyAccess(details.id);
            this.toasterService.popAsync('success', null, this.i18nService.t('removedUserId', this.userNamePipe.transform(details)));

            if (details instanceof EmergencyAccessGranteeDetailsResponse) {
                this.removeGrantee(details);
            } else {
                this.removeGrantor(details);
            }
        } catch { }
    }

    async requestAccess(details: EmergencyAccessGrantorDetailsResponse) {
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('requestAccessConfirmation', details.waitTimeDays.toString()),
            this.userNamePipe.transform(details),
            this.i18nService.t('requestAccess'),
            this.i18nService.t('no'),
            'warning',
        );

        if (!confirmed) {
            return false;
        }

        await this.apiService.postEmergencyAccessInitiate(details.id);

        details.status = EmergencyAccessStatusType.RecoveryInitiated;
        this.toasterService.popAsync('success', null, this.i18nService.t('requestSent', this.userNamePipe.transform(details)));
    }

    async approve(details: EmergencyAccessGranteeDetailsResponse) {
        const type = this.i18nService.t(details.type === EmergencyAccessType.View ? 'view' : 'takeover');

        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('approveAccessConfirmation', this.userNamePipe.transform(details), type),
            this.userNamePipe.transform(details),
            this.i18nService.t('approve'),
            this.i18nService.t('no'),
            'warning',
        );

        if (!confirmed) {
            return false;
        }

        await this.apiService.postEmergencyAccessApprove(details.id);
        details.status = EmergencyAccessStatusType.RecoveryApproved;

        this.toasterService.popAsync('success', null, this.i18nService.t('emergencyApproved', this.userNamePipe.transform(details)));
    }

    async reject(details: EmergencyAccessGranteeDetailsResponse) {
        await this.apiService.postEmergencyAccessReject(details.id);
        details.status = EmergencyAccessStatusType.Confirmed;

        this.toasterService.popAsync('success', null, this.i18nService.t('emergencyRejected', this.userNamePipe.transform(details)));
    }

    async takeover(details: EmergencyAccessGrantorDetailsResponse) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.addEditModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<EmergencyAccessTakeoverComponent>(
            EmergencyAccessTakeoverComponent, this.takeoverModalRef);

        childComponent.name = this.userNamePipe.transform(details);
        childComponent.email = details.email;
        childComponent.emergencyAccessId = details != null ? details.id : null;

        childComponent.onDone.subscribe(() => {
            this.modal.close();
            this.toasterService.popAsync('success', null, this.i18nService.t('passwordResetFor', this.userNamePipe.transform(details)));
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    private removeGrantee(details: EmergencyAccessGranteeDetailsResponse) {
        const index = this.trustedContacts.indexOf(details);
        if (index > -1) {
            this.trustedContacts.splice(index, 1);
        }
    }

    private removeGrantor(details: EmergencyAccessGrantorDetailsResponse) {
        const index = this.grantedContacts.indexOf(details);
        if (index > -1) {
            this.grantedContacts.splice(index, 1);
        }
    }

    // Encrypt the master password hash using the grantees public key, and send it to bitwarden for escrow.
    private async doConfirmation(details: EmergencyAccessGranteeDetailsResponse) {
        const encKey = await this.cryptoService.getEncKey();
        const publicKeyResponse = await this.apiService.getUserPublicKey(details.granteeId);
        const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);

        try {
            // tslint:disable-next-line
            console.log('User\'s fingerprint: ' +
                (await this.cryptoService.getFingerprint(details.granteeId, publicKey.buffer)).join('-'));
        } catch { }

        const encryptedKey = await this.cryptoService.rsaEncrypt(encKey.key, publicKey.buffer);
        const request = new EmergencyAccessConfirmRequest();
        request.key = encryptedKey.encryptedString;
        await this.apiService.postEmergencyAccessConfirm(details.id, request);
    }
}
