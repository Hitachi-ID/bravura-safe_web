import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { I18nService } from 'jslib-common/abstractions/i18n.service';

import { PolicyType } from 'jslib-common/enums/policyType';

import { BasePolicy, BasePolicyComponent } from './base-policy.component';

export class MasterPasswordPolicy extends BasePolicy {
    name = 'masterPass';
    description = 'masterPassPolicyDesc';
    type = PolicyType.MasterPassword;
    component = MasterPasswordPolicyComponent;
}

@Component({
    selector: 'policy-master-password',
    templateUrl: 'master-password.component.html',
})
export class MasterPasswordPolicyComponent extends BasePolicyComponent {

    data = this.fb.group({
        minComplexity: [null],
        minLength: [null],
        requireUpper: [null],
        requireLower: [null],
        requireNumbers: [null],
        requireSpecial: [null],
    });

    passwordScores: { name: string; value: number; }[];

    constructor(private fb: FormBuilder, i18nService: I18nService) {
        super();

        this.passwordScores = [
            { name: '-- ' + i18nService.t('select') + ' --', value: null },
            { name: i18nService.t('weak') + ' (0)', value: 0 },
            { name: i18nService.t('weak') + ' (1)', value: 1 },
            { name: i18nService.t('weak') + ' (2)', value: 2 },
            { name: i18nService.t('good') + ' (3)', value: 3 },
            { name: i18nService.t('strong') + ' (4)', value: 4 },
        ];
    }
}
