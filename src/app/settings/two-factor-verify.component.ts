import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { ToasterService } from 'angular2-toaster';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';

import { PasswordVerificationRequest } from 'jslib-common/models/request/passwordVerificationRequest';

@Component({
    selector: 'app-two-factor-verify',
    templateUrl: 'two-factor-verify.component.html',
})
export class TwoFactorVerifyComponent {
    @Input() type: TwoFactorProviderType;
    @Input() organizationId: string;
    @Output() onAuthed = new EventEmitter<any>();

    masterPassword: string;
    formPromise: Promise<any>;

    private masterPasswordHash: string;

    constructor(private apiService: ApiService, private i18nService: I18nService,
        private toasterService: ToasterService, private cryptoService: CryptoService,
        private logService: LogService) { }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }

        const request = new PasswordVerificationRequest();
        request.masterPasswordHash = this.masterPasswordHash =
            await this.cryptoService.hashPassword(this.masterPassword, null);

        try {
            switch (this.type) {
                case -1:
                    this.formPromise = this.apiService.getTwoFactorRecover(request);
                    break;
                case TwoFactorProviderType.Duo:
                case TwoFactorProviderType.OrganizationDuo:
                    if (this.organizationId != null) {
                        this.formPromise = this.apiService.getTwoFactorOrganizationDuo(this.organizationId, request);
                    } else {
                        this.formPromise = this.apiService.getTwoFactorDuo(request);
                    }
                    break;
                case TwoFactorProviderType.Email:
                    this.formPromise = this.apiService.getTwoFactorEmail(request);
                    break;
                case TwoFactorProviderType.WebAuthn:
                    this.formPromise = this.apiService.getTwoFactorWebAuthn(request);
                    break;
                case TwoFactorProviderType.Authenticator:
                    this.formPromise = this.apiService.getTwoFactorAuthenticator(request);
                    break;
                case TwoFactorProviderType.Yubikey:
                    this.formPromise = this.apiService.getTwoFactorYubiKey(request);
                    break;
            }

            const response = await this.formPromise;
            this.onAuthed.emit({
                response: response,
                masterPasswordHash: this.masterPasswordHash,
            });
        } catch (e) {
            this.logService.error(e);
        }
    }
}
