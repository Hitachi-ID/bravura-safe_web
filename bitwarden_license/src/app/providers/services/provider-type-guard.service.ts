import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";

import { ProviderService } from "jslib-common/abstractions/provider.service";
import { Permissions } from "jslib-common/enums/permissions";

@Injectable()
export class ProviderTypeGuardService implements CanActivate {
  constructor(private providerService: ProviderService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    const provider = await this.providerService.get(route.params.providerId);
    const permissions = route.data == null ? null : (route.data.permissions as Permissions[]);

    if (
      (permissions.indexOf(Permissions.AccessEventLogs) !== -1 && provider.canAccessEventLogs) ||
      (permissions.indexOf(Permissions.ManageProvider) !== -1 && provider.isProviderAdmin) ||
      (permissions.indexOf(Permissions.ManageUsers) !== -1 && provider.canManageUsers)
    ) {
      return true;
    }

    this.router.navigate(["/providers", provider.id]);
    return false;
  }
}
