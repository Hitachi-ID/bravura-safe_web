import {
    ChangeDetectorRef,
    Component,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { first } from 'rxjs/operators';

import { CipherType } from 'jslib-common/enums/cipherType';

import { CipherView } from 'jslib-common/models/view/cipherView';

import { OrganizationsComponent } from '../settings/organizations.component';
import { UpdateKeyComponent } from '../settings/update-key.component';
import { AddEditComponent } from './add-edit.component';
import { AttachmentsComponent } from './attachments.component';
import { CiphersComponent } from './ciphers.component';
import { CollectionsComponent } from './collections.component';
import { FolderAddEditComponent } from './folder-add-edit.component';
import { GroupingsComponent } from './groupings.component';
import { ShareComponent } from './share.component';

import { BroadcasterService } from 'jslib-common/abstractions/broadcaster.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { TokenService } from 'jslib-common/abstractions/token.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ModalService } from 'jslib-angular/services/modal.service';

const BroadcasterSubscriptionId = 'VaultComponent';

@Component({
    selector: 'app-vault',
    templateUrl: 'vault.component.html',
})
export class VaultComponent implements OnInit, OnDestroy {
    @ViewChild(GroupingsComponent, { static: true }) groupingsComponent: GroupingsComponent;
    @ViewChild(CiphersComponent, { static: true }) ciphersComponent: CiphersComponent;
    @ViewChild(OrganizationsComponent, { static: true }) organizationsComponent: OrganizationsComponent;
    @ViewChild('attachments', { read: ViewContainerRef, static: true }) attachmentsModalRef: ViewContainerRef;
    @ViewChild('folderAddEdit', { read: ViewContainerRef, static: true }) folderAddEditModalRef: ViewContainerRef;
    @ViewChild('cipherAddEdit', { read: ViewContainerRef, static: true }) cipherAddEditModalRef: ViewContainerRef;
    @ViewChild('share', { read: ViewContainerRef, static: true }) shareModalRef: ViewContainerRef;
    @ViewChild('collections', { read: ViewContainerRef, static: true }) collectionsModalRef: ViewContainerRef;
    @ViewChild('updateKeyTemplate', { read: ViewContainerRef, static: true }) updateKeyModalRef: ViewContainerRef;

    favorites: boolean = false;
    type: CipherType = null;
    folderId: string = null;
    collectionId: string = null;
    showVerifyEmail = false;
    showBrowserOutdated = false;
    showUpdateKey = false;
    showPremiumCallout = false;
    showRedeemSponsorship = false;
    showProviders = false;
    deleted: boolean = false;
    trashCleanupWarning: string = null;


    constructor(private syncService: SyncService, private route: ActivatedRoute,
        private router: Router, private changeDetectorRef: ChangeDetectorRef,
        private i18nService: I18nService, private modalService: ModalService,
        private tokenService: TokenService, private cryptoService: CryptoService,
        private messagingService: MessagingService, private userService: UserService,
        private platformUtilsService: PlatformUtilsService, private broadcasterService: BroadcasterService,
        private ngZone: NgZone) { }

    async ngOnInit() {
        this.showVerifyEmail = false;
        this.showBrowserOutdated = window.navigator.userAgent.indexOf('MSIE') !== -1;
        this.trashCleanupWarning = this.i18nService.t(
            this.platformUtilsService.isSelfHost() ? 'trashCleanupWarningSelfHosted' : 'trashCleanupWarning'
        );

        this.route.queryParams.pipe(first()).subscribe(async params => {
            await this.syncService.fullSync(false);

            this.showUpdateKey = !(await this.cryptoService.hasEncKey());
            const canAccessPremium = await this.userService.canAccessPremium();
            this.showPremiumCallout = !this.showVerifyEmail && !canAccessPremium &&
                !this.platformUtilsService.isSelfHost();

            this.showProviders = (await this.userService.getAllProviders()).length > 0;

            const allOrgs = await this.userService.getAllOrganizations();
            this.showRedeemSponsorship = allOrgs.some(o => o.familySponsorshipAvailable) && !allOrgs.some(o => o.familySponsorshipFriendlyName != null);

            await Promise.all([
                this.groupingsComponent.load(),
                this.organizationsComponent.load(),
            ]);

            if (params == null) {
                this.groupingsComponent.selectedAll = true;
                await this.ciphersComponent.reload();
            } else {
                if (params.deleted) {
                    this.groupingsComponent.selectedTrash = true;
                    await this.filterDeleted();
                } else if (params.favorites) {
                    this.groupingsComponent.selectedFavorites = true;
                    await this.filterFavorites();
                } else if (params.type) {
                    const t = parseInt(params.type, null);
                    this.groupingsComponent.selectedType = t;
                    await this.filterCipherType(t);
                } else if (params.folderId) {
                    this.groupingsComponent.selectedFolder = true;
                    this.groupingsComponent.selectedFolderId = params.folderId;
                    await this.filterFolder(params.folderId);
                } else if (params.collectionId) {
                    this.groupingsComponent.selectedCollectionId = params.collectionId;
                    await this.filterCollection(params.collectionId);
                } else {
                    this.groupingsComponent.selectedAll = true;
                    await this.ciphersComponent.reload();
                }
            }

            this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
                this.ngZone.run(async () => {
                    switch (message.command) {
                        case 'syncCompleted':
                            if (message.successfully) {
                                await Promise.all([
                                    this.groupingsComponent.load(),
                                    this.organizationsComponent.load(),
                                    this.ciphersComponent.load(this.ciphersComponent.filter),
                                ]);
                                this.changeDetectorRef.detectChanges();
                            }
                            break;
                    }
                });
            });
        });
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async clearGroupingFilters() {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchVault');
        await this.ciphersComponent.reload();
        this.clearFilters();
        this.go();
    }

    async filterFavorites() {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchFavorites');
        await this.ciphersComponent.reload(c => c.favorite);
        this.clearFilters();
        this.favorites = true;
        this.go();
    }

    async filterDeleted() {
        this.ciphersComponent.showAddNew = false;
        this.ciphersComponent.deleted = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchTrash');
        await this.ciphersComponent.reload(null, true);
        this.clearFilters();
        this.deleted = true;
        this.go();
    }

    async filterCipherType(type: CipherType) {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchType');
        await this.ciphersComponent.reload(c => c.type === type);
        this.clearFilters();
        this.type = type;
        this.go();
    }

    async filterFolder(folderId: string) {
        this.ciphersComponent.showAddNew = true;
        folderId = folderId === 'none' ? null : folderId;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchFolder');
        await this.ciphersComponent.reload(c => c.folderId === folderId);
        this.clearFilters();
        this.folderId = folderId == null ? 'none' : folderId;
        this.go();
    }

    async filterCollection(collectionId: string) {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchCollection');
        await this.ciphersComponent.reload(c => c.collectionIds != null &&
            c.collectionIds.indexOf(collectionId) > -1);
        this.clearFilters();
        this.collectionId = collectionId;
        this.go();
    }

    filterSearchText(searchText: string) {
        this.ciphersComponent.searchText = searchText;
        this.ciphersComponent.search(200);
    }

    async editCipherAttachments(cipher: CipherView) {
        const canAccessPremium = await this.userService.canAccessPremium();
        if (cipher.organizationId == null && !canAccessPremium) {
            this.messagingService.send('premiumRequired');
            return;
        } else if (cipher.organizationId != null) {
            const org = await this.userService.getOrganization(cipher.organizationId);
            if (org != null && (org.maxStorageGb == null || org.maxStorageGb === 0)) {
                this.messagingService.send('upgradeOrganization', { organizationId: cipher.organizationId });
                return;
            }
        }

        let madeAttachmentChanges = false;
        const [modal] = await this.modalService.openViewRef(AttachmentsComponent, this.attachmentsModalRef, comp => {
            comp.cipherId = cipher.id;
            comp.onUploadedAttachment.subscribe(() => madeAttachmentChanges = true);
            comp.onDeletedAttachment.subscribe(() => madeAttachmentChanges = true);
            comp.onReuploadedAttachment.subscribe(() => madeAttachmentChanges = true);
        });

        modal.onClosed.subscribe(async () => {
            if (madeAttachmentChanges) {
                await this.ciphersComponent.refresh();
            }
            madeAttachmentChanges = false;
        });
    }

    async shareCipher(cipher: CipherView) {
        const [modal] = await this.modalService.openViewRef(ShareComponent, this.shareModalRef, comp => {
            comp.cipherId = cipher.id;
            comp.onSharedCipher.subscribe(async () => {
                modal.close();
                await this.ciphersComponent.refresh();
            });
        });
    }

    async editCipherCollections(cipher: CipherView) {
        const [modal] = await this.modalService.openViewRef(CollectionsComponent, this.collectionsModalRef, comp => {
            comp.cipherId = cipher.id;
            comp.onSavedCollections.subscribe(async () => {
                modal.close();
                await this.ciphersComponent.refresh();
            });
        });
    }

    async addFolder() {
        const [modal] = await this.modalService.openViewRef(FolderAddEditComponent, this.folderAddEditModalRef, comp => {
            comp.folderId = null;
            comp.onSavedFolder.subscribe(async () => {
                modal.close();
                await this.groupingsComponent.loadFolders();
            });
        });
    }

    async editFolder(folderId: string) {
        const [modal] = await this.modalService.openViewRef(FolderAddEditComponent, this.folderAddEditModalRef, comp => {
            comp.folderId = folderId;
            comp.onSavedFolder.subscribe(async () => {
                modal.close();
                await this.groupingsComponent.loadFolders();
            });
            comp.onDeletedFolder.subscribe(async () => {
                modal.close();
                await this.groupingsComponent.loadFolders();
                await this.filterFolder('none');
                this.groupingsComponent.selectedFolderId = null;
            });
        });
    }

    async addCipher() {
        const component = await this.editCipher(null);
        component.type = this.type;
        component.folderId = this.folderId === 'none' ? null : this.folderId;
        if (this.collectionId != null) {
            const collection = this.groupingsComponent.collections.filter(c => c.id === this.collectionId);
            if (collection.length > 0) {
                component.organizationId = collection[0].organizationId;
                component.collectionIds = [this.collectionId];
            }
        }
    }

    async editCipher(cipher: CipherView) {
        const [modal, childComponent] = await this.modalService.openViewRef(AddEditComponent, this.cipherAddEditModalRef, comp => {
            comp.cipherId = cipher == null ? null : cipher.id;
            comp.onSavedCipher.subscribe(async (c: CipherView) => {
                modal.close();
                await this.ciphersComponent.refresh();
            });
            comp.onDeletedCipher.subscribe(async (c: CipherView) => {
                modal.close();
                await this.ciphersComponent.refresh();
            });
            comp.onRestoredCipher.subscribe(async (c: CipherView) => {
                modal.close();
                await this.ciphersComponent.refresh();
            });
        });

        return childComponent;
    }

    async cloneCipher(cipher: CipherView) {
        const component = await this.editCipher(cipher);
        component.cloneMode = true;
    }

    async updateKey() {
        await this.modalService.openViewRef(UpdateKeyComponent, this.updateKeyModalRef);
    }

    private clearFilters() {
        this.folderId = null;
        this.collectionId = null;
        this.favorites = false;
        this.type = null;
        this.deleted = false;
    }

    private go(queryParams: any = null) {
        if (queryParams == null) {
            queryParams = {
                favorites: this.favorites ? true : null,
                type: this.type,
                folderId: this.folderId,
                collectionId: this.collectionId,
                deleted: this.deleted ? true : null,
            };
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            replaceUrl: true,
        });
    }
}
