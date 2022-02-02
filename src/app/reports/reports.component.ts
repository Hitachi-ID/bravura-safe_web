import { Component, OnInit } from "@angular/core";

import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { UserService } from "jslib-common/abstractions/user.service";

@Component({
  selector: "app-reports",
  templateUrl: "reports.component.html",
})
export class ReportsComponent implements OnInit {
  canAccessPremium = false;

  constructor(private userService: UserService, private messagingService: MessagingService) {}

  async ngOnInit() {
    this.canAccessPremium = await this.userService.canAccessPremium();
  }

  premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
  }
}
