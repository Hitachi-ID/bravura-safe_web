import {
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { UserService } from 'jslib-common/abstractions/user.service';
import { UserVerificationService } from 'jslib-common/abstractions/userVerification.service';

import { UpdateTwoFactorAuthenticatorRequest } from 'jslib-common/models/request/updateTwoFactorAuthenticatorRequest';
import { TwoFactorAuthenticatorResponse } from 'jslib-common/models/response/twoFactorAuthenticatorResponse';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { TwoFactorBaseComponent } from './two-factor-base.component';

@Component({
    selector: 'app-two-factor-authenticator',
    templateUrl: 'two-factor-authenticator.component.html',
})
export class TwoFactorAuthenticatorComponent extends TwoFactorBaseComponent implements OnInit, OnDestroy {
    type = TwoFactorProviderType.Authenticator;
    key: string;
    token: string;
    formPromise: Promise<any>;

    private qrScript: HTMLScriptElement;

    constructor(apiService: ApiService, i18nService: I18nService,
        userVerificationService: UserVerificationService,
        platformUtilsService: PlatformUtilsService, logService: LogService,
        private userService: UserService) {
        super(apiService, i18nService, platformUtilsService, logService, userVerificationService);
        this.qrScript = window.document.createElement('script');
        this.qrScript.src = 'scripts/qrious.min.js';
        this.qrScript.async = true;
    }

    ngOnInit() {
        window.document.body.appendChild(this.qrScript);
    }

    ngOnDestroy() {
        window.document.body.removeChild(this.qrScript);
    }

    auth(authResponse: any) {
        super.auth(authResponse);
        return this.processResponse(authResponse.response);
    }

    submit() {
        if (this.enabled) {
            return super.disable(this.formPromise);
        } else {
            return this.enable();
        }
    }

    protected async enable() {
        const request = await this.buildRequestModel(UpdateTwoFactorAuthenticatorRequest);
        request.token = this.token;
        request.key = this.key;

        return super.enable(async () => {
            this.formPromise = this.apiService.putTwoFactorAuthenticator(request);
            const response = await this.formPromise;
            await this.processResponse(response);
        });
    }

    private async processResponse(response: TwoFactorAuthenticatorResponse) {
        this.token = null;
        this.enabled = response.enabled;
        this.key = response.key;
        const email = await this.userService.getEmail();
        window.setTimeout(() => {
            const qr = new (window as any).QRious({
                element: document.getElementById('qr'),
                value: 'otpauth://totp/Bravura Safe:' + encodeURIComponent(email) +
                    '?secret=' + encodeURIComponent(this.key) + '&issuer=Hitachi ID',
                size: 160,
            });
        }, 100);
    }
}
