import { DatePipe } from '@angular/common';

import { Component } from '@angular/core';

import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { SendService } from 'jslib-common/abstractions/send.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { AddEditComponent as BaseAddEditComponent } from 'jslib-angular/components/send/add-edit.component';
import { LogService } from 'jslib-common/abstractions/log.service';

@Component({
    selector: 'app-send-add-edit',
    templateUrl: 'add-edit.component.html',
})
export class AddEditComponent extends BaseAddEditComponent {
    constructor(i18nService: I18nService, platformUtilsService: PlatformUtilsService,
        environmentService: EnvironmentService, datePipe: DatePipe,
        sendService: SendService, userService: UserService,
        messagingService: MessagingService, policyService: PolicyService,
        logService: LogService) {
        super(i18nService, platformUtilsService, environmentService, datePipe, sendService, userService,
            messagingService, policyService, logService);
    }

    async copyLinkToClipboard(link: string): Promise<void | boolean> {
        // Copy function on web depends on the modal being open or not. Since this event occurs during a transition
        // of the modal closing we need to add a small delay to make sure state of the DOM is consistent.
        return new Promise(resolve => {
            window.setTimeout(() => resolve(super.copyLinkToClipboard(link)), 500);
        });
    }
}
