import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';

import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { ProviderService } from 'jslib-common/abstractions/provider.service';

import { ValidationService } from 'jslib-angular/services/validation.service';

import { WebProviderService } from '../services/webProvider.service';

import { Organization } from 'jslib-common/models/domain/organization';
import { Provider } from 'jslib-common/models/domain/provider';

@Component({
    selector: 'provider-add-organization',
    templateUrl: 'add-organization.component.html',
})
export class AddOrganizationComponent implements OnInit {

    @Input() providerId: string;
    @Input() organizations: Organization[];
    @Output() onAddedOrganization = new EventEmitter();

    provider: Provider;
    formPromise: Promise<any>;
    loading = true;

    constructor(
        private providerService: ProviderService,
        private webProviderService: WebProviderService,
        private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService,
        private validationService: ValidationService
    ) { }

    async ngOnInit() {
        await this.load();
    }

    async load() {
        if (this.providerId == null) {
            return;
        }

        this.provider = await this.providerService.get(this.providerId);

        this.loading = false;
    }

    async add(organization: Organization) {
        if (this.formPromise) {
            return;
        }

        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('addOrganizationConfirmation', organization.name, this.provider.name), organization.name,
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');

        if (!confirmed) {
            return false;
        }

        try {
            this.formPromise = this.webProviderService.addOrganizationToProvider(this.providerId, organization.id);
            await this.formPromise;
        } catch (e) {
            this.validationService.showError(e);
            return;
        } finally {
            this.formPromise = null;
        }

        this.platformUtilsService.showToast('success', null, this.i18nService.t('organizationJoinedProvider'));
        this.onAddedOrganization.emit();
    }
}
