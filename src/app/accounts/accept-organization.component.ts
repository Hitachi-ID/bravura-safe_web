import { Component } from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import {
    Toast,
    ToasterService,
} from 'angular2-toaster';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { StateService } from 'jslib-common/abstractions/state.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { OrganizationUserAcceptRequest } from 'jslib-common/models/request/organizationUserAcceptRequest';
import { OrganizationUserResetPasswordEnrollmentRequest } from 'jslib-common/models/request/organizationUserResetPasswordEnrollmentRequest';

import { Utils } from 'jslib-common/misc/utils';
import { Policy } from 'jslib-common/models/domain/policy';
import { BaseAcceptComponent } from '../common/base.accept.component';

@Component({
    selector: 'app-accept-organization',
    templateUrl: 'accept-organization.component.html',
})
export class AcceptOrganizationComponent extends BaseAcceptComponent {
    orgName: string;

    protected requiredParameters: string[] = ['organizationId', 'organizationUserId', 'token'];

    constructor(router: Router, toasterService: ToasterService,
        i18nService: I18nService, route: ActivatedRoute,
        private apiService: ApiService, userService: UserService,
        stateService: StateService, private cryptoService: CryptoService,
        private policyService: PolicyService) {
        super(router, toasterService, i18nService, route, userService, stateService);
    }

    async authedHandler(qParams: any): Promise<void> {
        const request = new OrganizationUserAcceptRequest();
        request.token = qParams.token;
        if (await this.performResetPasswordAutoEnroll(qParams)) {
            this.actionPromise = this.apiService.postOrganizationUserAccept(qParams.organizationId,
                qParams.organizationUserId, request).then(() => {
                    // Retrieve Public Key
                    return this.apiService.getOrganizationKeys(qParams.organizationId);
                }).then(async response => {
                    if (response == null) {
                        throw new Error(this.i18nService.t('resetPasswordOrgKeysError'));
                    }

                    const publicKey = Utils.fromB64ToArray(response.publicKey);

                    // RSA Encrypt user's encKey.key with organization public key
                    const encKey = await this.cryptoService.getEncKey();
                    const encryptedKey = await this.cryptoService.rsaEncrypt(encKey.key, publicKey.buffer);

                    // Create request and execute enrollment
                    const resetRequest = new OrganizationUserResetPasswordEnrollmentRequest();
                    resetRequest.resetPasswordKey = encryptedKey.encryptedString;

                    // Get User Id
                    const userId = await this.userService.getUserId();

                    return this.apiService.putOrganizationUserResetPasswordEnrollment(qParams.organizationId, userId, resetRequest);
                });
        } else {
            this.actionPromise = this.apiService.postOrganizationUserAccept(qParams.organizationId,
                qParams.organizationUserId, request);
        }

        await this.actionPromise;
        const toast: Toast = {
            type: 'success',
            title: this.i18nService.t('inviteAccepted'),
            body: this.i18nService.t('inviteAcceptedDesc'),
            timeout: 10000,
        };
        this.toasterService.popAsync(toast);

        await this.stateService.remove('orgInvitation');
        this.router.navigate(['/vault']);
    }

    async unauthedHandler(qParams: any): Promise<void> {
        this.orgName = qParams.organizationName;
        if (this.orgName != null) {
            // Fix URL encoding of space issue with Angular
            this.orgName = this.orgName.replace(/\+/g, ' ');
        }
        await this.stateService.save('orgInvitation', qParams);
    }

    private async performResetPasswordAutoEnroll(qParams: any): Promise<boolean> {
        let policyList: Policy[] = null;
        try {
            const policies = await this.apiService.getPoliciesByToken(qParams.organizationId, qParams.token,
                qParams.email, qParams.organizationUserId);
            policyList = this.policyService.mapPoliciesFromToken(policies);
        } catch { }

        if (policyList != null) {
            const result = this.policyService.getResetPasswordPolicyOptions(policyList, qParams.organizationId);
            // Return true if policy enabled and auto-enroll enabled
            return result[1] && result[0].autoEnrollEnabled;
        }

        return false;
    }
}
