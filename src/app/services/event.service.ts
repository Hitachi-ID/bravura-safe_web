import { Injectable } from '@angular/core';

import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';

import { DeviceType } from 'jslib-common/enums/deviceType';
import { EventType } from 'jslib-common/enums/eventType';
import { PolicyType } from 'jslib-common/enums/policyType';

import { EventResponse } from 'jslib-common/models/response/eventResponse';


@Injectable()
export class EventService {
    constructor(private i18nService: I18nService, private policyService: PolicyService) { }

    getDefaultDateFilters() {
        const d = new Date();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
        d.setDate(d.getDate() - 30);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0);
        return [this.toDateTimeLocalString(start), this.toDateTimeLocalString(end)];
    }

    formatDateFilters(filterStart: string, filterEnd: string) {
        const start: Date = new Date(filterStart);
        const end: Date = new Date(filterEnd + ':59.999');
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            throw new Error('Invalid date range.');
        }
        return [start.toISOString(), end.toISOString()];
    }

    async getEventInfo(ev: EventResponse, options = new EventOptions()): Promise<EventInfo> {
        const appInfo = this.getAppInfo(ev.deviceType);
        const { message, humanReadableMessage } = await this.getEventMessage(ev, options);
        return {
            message: message,
            humanReadableMessage: humanReadableMessage,
            appIcon: appInfo[0],
            appName: appInfo[1],
        };
    }

    private async getEventMessage(ev: EventResponse, options: EventOptions) {
        let msg = '';
        let humanReadableMsg = '';
        switch (ev.type) {
            // User
            case EventType.User_LoggedIn:
                msg = humanReadableMsg = this.i18nService.t('loggedIn');
                break;
            case EventType.User_ChangedPassword:
                msg = humanReadableMsg = this.i18nService.t('changedPassword');
                break;
            case EventType.User_Updated2fa:
                msg = humanReadableMsg = this.i18nService.t('enabledUpdated2fa');
                break;
            case EventType.User_Disabled2fa:
                msg = humanReadableMsg = this.i18nService.t('disabled2fa');
                break;
            case EventType.User_Recovered2fa:
                msg = humanReadableMsg = this.i18nService.t('recovered2fa');
                break;
            case EventType.User_FailedLogIn:
                msg = humanReadableMsg = this.i18nService.t('failedLogin');
                break;
            case EventType.User_FailedLogIn2fa:
                msg = humanReadableMsg = this.i18nService.t('failedLogin2fa');
                break;
            case EventType.User_ClientExportedVault:
                msg = humanReadableMsg = this.i18nService.t('exportedVault');
                break;
            // Cipher
            case EventType.Cipher_Created:
                msg = this.i18nService.t('createdItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('createdItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_Updated:
                msg = this.i18nService.t('editedItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('editedItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_Deleted:
                msg = this.i18nService.t('permanentlyDeletedItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('permanentlyDeletedItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_SoftDeleted:
                msg = this.i18nService.t('deletedItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('deletedItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_Restored:
                msg = this.i18nService.t('restoredItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('restoredItemId', this.formatCipherId(ev, options));
                break;
            case EventType.Cipher_AttachmentCreated:
                msg = this.i18nService.t('createdAttachmentForItem', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('createdAttachmentForItem', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_AttachmentDeleted:
                msg = this.i18nService.t('deletedAttachmentForItem', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('deletedAttachmentForItem', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_Shared:
                msg = this.i18nService.t('movedItemIdToOrg', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('movedItemIdToOrg', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientViewed:
                msg = this.i18nService.t('viewedItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('viewedItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientToggledPasswordVisible:
                msg = this.i18nService.t('viewedPasswordItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('viewedPasswordItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientToggledHiddenFieldVisible:
                msg = this.i18nService.t('viewedHiddenFieldItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('viewedHiddenFieldItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientToggledCardCodeVisible:
                msg = this.i18nService.t('viewedSecurityCodeItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('viewedSecurityCodeItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientCopiedHiddenField:
                msg = this.i18nService.t('copiedHiddenFieldItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('copiedHiddenFieldItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientCopiedPassword:
                msg = this.i18nService.t('copiedPasswordItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('copiedPasswordItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientCopiedCardCode:
                msg = this.i18nService.t('copiedSecurityCodeItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('copiedSecurityCodeItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_ClientAutofilled:
                msg = this.i18nService.t('autofilledItemId', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('autofilledItemId', this.getShortId(ev.cipherId));
                break;
            case EventType.Cipher_UpdatedCollections:
                msg = this.i18nService.t('editedCollectionsForItem', this.formatCipherId(ev, options));
                humanReadableMsg = this.i18nService.t('editedCollectionsForItem', this.getShortId(ev.cipherId));
                break;
            // Collection
            case EventType.Collection_Created:
                msg = this.i18nService.t('createdCollectionId', this.formatCollectionId(ev));
                humanReadableMsg = this.i18nService.t('createdCollectionId', this.getShortId(ev.collectionId));
                break;
            case EventType.Collection_Updated:
                msg = this.i18nService.t('editedCollectionId', this.formatCollectionId(ev));
                humanReadableMsg = this.i18nService.t('editedCollectionId', this.getShortId(ev.collectionId));
                break;
            case EventType.Collection_Deleted:
                msg = this.i18nService.t('deletedCollectionId', this.formatCollectionId(ev));
                humanReadableMsg = this.i18nService.t('deletedCollectionId', this.getShortId(ev.collectionId));
                break;
            // Group
            case EventType.Group_Created:
                msg = this.i18nService.t('createdGroupId', this.formatGroupId(ev));
                humanReadableMsg = this.i18nService.t('createdGroupId', this.getShortId(ev.groupId));
                break;
            case EventType.Group_Updated:
                msg = this.i18nService.t('editedGroupId', this.formatGroupId(ev));
                humanReadableMsg = this.i18nService.t('editedGroupId', this.getShortId(ev.groupId));
                break;
            case EventType.Group_Deleted:
                msg = this.i18nService.t('deletedGroupId', this.formatGroupId(ev));
                humanReadableMsg = this.i18nService.t('deletedGroupId', this.getShortId(ev.groupId));
                break;
            // Org user
            case EventType.OrganizationUser_Invited:
                msg = this.i18nService.t('invitedUserId', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('invitedUserId', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_Confirmed:
                msg = this.i18nService.t('confirmedUserId', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('confirmedUserId', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_Updated:
                msg = this.i18nService.t('editedUserId', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('editedUserId', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_Removed:
                msg = this.i18nService.t('removedUserId', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('removedUserId', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_UpdatedGroups:
                msg = this.i18nService.t('editedGroupsForUser', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('editedGroupsForUser', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_UnlinkedSso:
                msg = this.i18nService.t('unlinkedSsoUser', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('unlinkedSsoUser', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_ResetPassword_Enroll:
                msg = this.i18nService.t('eventEnrollPasswordReset', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('eventEnrollPasswordReset', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_ResetPassword_Withdraw:
                msg = this.i18nService.t('eventWithdrawPasswordReset', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('eventWithdrawPasswordReset', this.getShortId(ev.organizationUserId));
                break;
            case EventType.OrganizationUser_AdminResetPassword:
                msg = this.i18nService.t('eventAdminPasswordReset', this.formatOrgUserId(ev));
                humanReadableMsg = this.i18nService.t('eventAdminPasswordReset', this.getShortId(ev.organizationUserId));
                break;
            // Org
            case EventType.Organization_Updated:
                msg = humanReadableMsg = this.i18nService.t('editedOrgSettings');
                break;
            case EventType.Organization_PurgedVault:
                msg = humanReadableMsg = this.i18nService.t('purgedOrganizationVault');
                break;
            /*
            case EventType.Organization_ClientExportedVault:
                msg = this.i18nService.t('exportedOrganizationVault');
                break;
            */
            // Policies
            case EventType.Policy_Updated:
                msg = this.i18nService.t('modifiedPolicyId', this.formatPolicyId(ev));

                const policies = await this.policyService.getAll();
                const policy = policies.filter(p => p.id === ev.policyId)[0];
                let p1 = this.getShortId(ev.policyId);
                if (policy !== null) {
                    p1 = PolicyType[policy.type];
                }

                humanReadableMsg = this.i18nService.t('modifiedPolicyId', p1);
                break;

            default:
                break;
        }
        return {
            message: msg === '' ? null : msg,
            humanReadableMessage: humanReadableMsg === '' ? null : humanReadableMsg,
        };
    }

    private getAppInfo(deviceType: DeviceType): [string, string] {
        switch (deviceType) {
            case DeviceType.Android:
                return ['fa-android', this.i18nService.t('mobile') + ' - Android'];
            case DeviceType.iOS:
                return ['fa-apple', this.i18nService.t('mobile') + ' - iOS'];
            case DeviceType.UWP:
                return ['fa-windows', this.i18nService.t('mobile') + ' - Windows'];
            case DeviceType.ChromeExtension:
                return ['fa-chrome', this.i18nService.t('extension') + ' - Chrome'];
            case DeviceType.FirefoxExtension:
                return ['fa-firefox', this.i18nService.t('extension') + ' - Firefox'];
            case DeviceType.OperaExtension:
                return ['fa-opera', this.i18nService.t('extension') + ' - Opera'];
            case DeviceType.EdgeExtension:
                return ['fa-edge', this.i18nService.t('extension') + ' - Edge'];
            case DeviceType.VivaldiExtension:
                return ['fa-puzzle-piece', this.i18nService.t('extension') + ' - Vivaldi'];
            case DeviceType.SafariExtension:
                return ['fa-safari', this.i18nService.t('extension') + ' - Safari'];
            case DeviceType.WindowsDesktop:
                return ['fa-windows', this.i18nService.t('desktop') + ' - Windows'];
            case DeviceType.MacOsDesktop:
                return ['fa-apple', this.i18nService.t('desktop') + ' - macOS'];
            case DeviceType.LinuxDesktop:
                return ['fa-linux', this.i18nService.t('desktop') + ' - Linux'];
            case DeviceType.ChromeBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Chrome'];
            case DeviceType.FirefoxBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Firefox'];
            case DeviceType.OperaBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Opera'];
            case DeviceType.SafariBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Safari'];
            case DeviceType.VivaldiBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Vivaldi'];
            case DeviceType.EdgeBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - Edge'];
            case DeviceType.IEBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - IE'];
            case DeviceType.UnknownBrowser:
                return ['fa-globe', this.i18nService.t('webVault') + ' - ' + this.i18nService.t('unknown')];
            default:
                return ['fa-globe', this.i18nService.t('unknown')];
        }
    }

    private formatCipherId(ev: EventResponse, options: EventOptions) {
        const shortId = this.getShortId(ev.cipherId);
        if (ev.organizationId == null || !options.cipherInfo) {
            return '<code>' + shortId + '</code>';
        }
        const a = this.makeAnchor(shortId);
        a.setAttribute('href', '#/organizations/' + ev.organizationId + '/vault?search=' + shortId +
            '&viewEvents=' + ev.cipherId);
        return a.outerHTML;
    }

    private formatGroupId(ev: EventResponse) {
        const shortId = this.getShortId(ev.groupId);
        const a = this.makeAnchor(shortId);
        a.setAttribute('href', '#/organizations/' + ev.organizationId + '/manage/groups?search=' + shortId);
        return a.outerHTML;
    }

    private formatCollectionId(ev: EventResponse) {
        const shortId = this.getShortId(ev.collectionId);
        const a = this.makeAnchor(shortId);
        a.setAttribute('href', '#/organizations/' + ev.organizationId + '/manage/collections?search=' + shortId);
        return a.outerHTML;
    }

    private formatOrgUserId(ev: EventResponse) {
        const shortId = this.getShortId(ev.organizationUserId);
        const a = this.makeAnchor(shortId);
        a.setAttribute('href', '#/organizations/' + ev.organizationId + '/manage/people?search=' + shortId +
            '&viewEvents=' + ev.organizationUserId);
        return a.outerHTML;
    }

    private formatPolicyId(ev: EventResponse) {
        const shortId = this.getShortId(ev.policyId);
        const a = this.makeAnchor(shortId);
        a.setAttribute('href', '#/organizations/' + ev.organizationId + '/manage/policies?policyId=' + ev.policyId);
        return a.outerHTML;
    }

    private makeAnchor(shortId: string) {
        const a = document.createElement('a');
        a.title = this.i18nService.t('view');
        a.innerHTML = '<code>' + shortId + '</code>';
        return a;
    }

    private getShortId(id: string) {
        return id.substring(0, 8);
    }

    private toDateTimeLocalString(date: Date) {
        return date.getFullYear() +
            '-' + this.pad(date.getMonth() + 1) +
            '-' + this.pad(date.getDate()) +
            'T' + this.pad(date.getHours()) +
            ':' + this.pad(date.getMinutes());
    }

    private pad(num: number) {
        const norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
    }
}

export class EventInfo {
    message: string;
    humanReadableMessage: string;
    appIcon: string;
    appName: string;
}

export class EventOptions {
    cipherInfo = true;
}
