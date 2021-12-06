import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ModalService } from 'jslib-angular/services/modal.service';

import { Cipher } from 'jslib-common/models/domain/cipher';

import { CipherView } from 'jslib-common/models/view/cipherView';

import {
    WeakPasswordsReportComponent as BaseWeakPasswordsReportComponent,
} from '../../reports/weak-passwords-report.component';

@Component({
    selector: 'app-weak-passwords-report',
    templateUrl: '../../reports/weak-passwords-report.component.html',
})
export class WeakPasswordsReportComponent extends BaseWeakPasswordsReportComponent {
    manageableCiphers: Cipher[];

    constructor(cipherService: CipherService, passwordGenerationService: PasswordGenerationService,
        modalService: ModalService, messagingService: MessagingService,
        userService: UserService, private route: ActivatedRoute) {
        super(cipherService, passwordGenerationService, modalService, messagingService, userService);
    }

    async ngOnInit() {
        this.route.parent.parent.params.subscribe(async params => {
            this.organization = await this.userService.getOrganization(params.organizationId);
            this.manageableCiphers = await this.cipherService.getAll();
            await super.ngOnInit();
        });
    }

    getAllCiphers(): Promise<CipherView[]> {
        return this.cipherService.getAllFromApiForOrganization(this.organization.id);
    }

    canManageCipher(c: CipherView): boolean {
        return this.manageableCiphers.some(x => x.id === c.id);
    }
}
