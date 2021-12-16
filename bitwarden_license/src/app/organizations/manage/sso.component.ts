import {
    Component,
    OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { OrganizationSsoRequest } from 'jslib-common/models/request/organization/organizationSsoRequest';

@Component({
    selector: 'app-org-manage-sso',
    templateUrl: 'sso.component.html',
})
export class SsoComponent implements OnInit {

    samlSigningAlgorithms = [
        'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        'http://www.w3.org/2000/09/xmldsig#rsa-sha384',
        'http://www.w3.org/2000/09/xmldsig#rsa-sha512',
        'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    ];

    loading = true;
    organizationId: string;
    formPromise: Promise<any>;

    callbackPath: string;
    signedOutCallbackPath: string;
    spEntityId: string;
    spMetadataUrl: string;
    spAcsUrl: string;

    enabled = this.fb.control(false);
    data = this.fb.group({
        configType: [],

        useCryptoAgent: [],
        cryptoAgentUrl: [],

        // OpenId
        authority: [],
        clientId: [],
        clientSecret: [],
        metadataAddress: [],
        redirectBehavior: [],
        getClaimsFromUserInfoEndpoint: [],
        additionalScopes: [],
        additionalUserIdClaimTypes: [],
        additionalEmailClaimTypes: [],
        additionalNameClaimTypes: [],
        acrValues: [],
        expectedReturnAcrValue: [],

        // SAML
        spNameIdFormat: [],
        spOutboundSigningAlgorithm: [],
        spSigningBehavior: [],
        spMinIncomingSigningAlgorithm: [],
        spWantAssertionsSigned: [],
        spValidateCertificates: [],

        idpEntityId: [],
        idpBindingType: [],
        idpSingleSignOnServiceUrl: [],
        idpSingleLogoutServiceUrl: [],
        idpArtifactResolutionServiceUrl: [],
        idpX509PublicCert: [],
        idpOutboundSigningAlgorithm: [],
        idpAllowUnsolicitedAuthnResponse: [],
        idpDisableOutboundLogoutRequests: [],
        idpWantAuthnRequestsSigned: [],
    });

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private apiService: ApiService,
        private platformUtilsService: PlatformUtilsService, private i18nService: I18nService) { }

    async ngOnInit() {
        this.route.parent.parent.params.subscribe(async params => {
            this.organizationId = params.organizationId;
            await this.load();
        });
    }

    async load() {
        const ssoSettings = await this.apiService.getOrganizationSso(this.organizationId);

        this.data.patchValue(ssoSettings.data);
        this.enabled.setValue(ssoSettings.enabled);

        this.callbackPath = ssoSettings.urls.callbackPath;
        this.signedOutCallbackPath = ssoSettings.urls.signedOutCallbackPath;
        this.spEntityId = ssoSettings.urls.spEntityId;
        this.spMetadataUrl = ssoSettings.urls.spMetadataUrl;
        this.spAcsUrl = ssoSettings.urls.spAcsUrl;

        this.loading = false;
    }

    copy(value: string) {
        this.platformUtilsService.copyToClipboard(value);
    }

    launchUri(url: string) {
        this.platformUtilsService.launchUri(url);
    }

    async submit() {
        const request = new OrganizationSsoRequest();
        request.enabled = this.enabled.value;
        request.data = this.data.value;

        this.formPromise = this.apiService.postOrganizationSso(this.organizationId, request);

        const response = await this.formPromise;
        this.data.patchValue(response.data);
        this.enabled.setValue(response.enabled);

        this.formPromise = null;
        this.platformUtilsService.showToast('success', null, this.i18nService.t('ssoSettingsSaved'));
    }
}
