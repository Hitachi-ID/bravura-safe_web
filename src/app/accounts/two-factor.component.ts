import {
    Component,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';

import { ModalService } from 'jslib-angular/services/modal.service';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { TwoFactorComponent as BaseTwoFactorComponent } from 'jslib-angular/components/two-factor.component';

import { TwoFactorOptionsComponent } from './two-factor-options.component';

@Component({
    selector: 'app-two-factor',
    templateUrl: 'two-factor.component.html',
})
export class TwoFactorComponent extends BaseTwoFactorComponent {
    @ViewChild('twoFactorOptions', { read: ViewContainerRef, static: true }) twoFactorOptionsModal: ViewContainerRef;

    constructor(authService: AuthService, router: Router,
        i18nService: I18nService, apiService: ApiService,
        platformUtilsService: PlatformUtilsService, stateService: StateService,
        environmentService: EnvironmentService, private modalService: ModalService,
        route: ActivatedRoute, logService: LogService) {
        super(authService, router, i18nService, apiService, platformUtilsService, window, environmentService,
            stateService, route, logService);
        this.onSuccessfulLoginNavigate = this.goAfterLogIn;
    }

    async anotherMethod() {
        const [modal] = await this.modalService.openViewRef(TwoFactorOptionsComponent, this.twoFactorOptionsModal, comp => {
            comp.onProviderSelected.subscribe(async (provider: TwoFactorProviderType) => {
                modal.close();
                this.selectedProviderType = provider;
                await this.init();
            });
            comp.onRecoverSelected.subscribe(() => {
                modal.close();
            });
        });
    }

    async goAfterLogIn() {
        const loginRedirect = await this.stateService.getLoginRedirect();
        if (loginRedirect != null) {
            this.router.navigate([loginRedirect.route], { queryParams: loginRedirect.qParams });
            await this.stateService.setLoginRedirect(null);
        } else {
            this.router.navigate([this.successRoute], {
                queryParams: {
                    identifier: this.identifier,
                },
            });
        }
    }
}
