import { Component } from "@angular/core";

import { PolicyType } from "jslib-common/enums/policyType";
import { Organization } from "jslib-common/models/domain/organization";

import { BasePolicy, BasePolicyComponent } from "./base-policy.component";

export class TwoFactorAuthenticationPolicy extends BasePolicy {
  name = "twoStepLogin";
  description = "twoStepLoginPolicyDesc";
  type = PolicyType.TwoFactorAuthentication;
  component = TwoFactorAuthenticationPolicyComponent;

  display(organization: Organization) {
    return organization.use2fa;
  }
}

@Component({
  selector: "policy-two-factor-authentication",
  templateUrl: "two-factor-authentication.component.html",
})
export class TwoFactorAuthenticationPolicyComponent extends BasePolicyComponent {}
