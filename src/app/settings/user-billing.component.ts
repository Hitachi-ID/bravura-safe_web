import { Component, OnInit } from "@angular/core";

import { BillingResponse } from "jslib-common/models/response/billingResponse";

import { ApiService } from "jslib-common/abstractions/api.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";

import { PaymentMethodType } from "jslib-common/enums/paymentMethodType";
import { TransactionType } from "jslib-common/enums/transactionType";
import { VerifyBankRequest } from "jslib-common/models/request/verifyBankRequest";

@Component({
  selector: "app-user-billing",
  templateUrl: "user-billing.component.html",
})
export class UserBillingComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  showAdjustPayment = false;
  showAddCredit = false;
  billing: BillingResponse;
  paymentMethodType = PaymentMethodType;
  transactionType = TransactionType;
  organizationId: string;
  verifyAmount1: number;
  verifyAmount2: number;

  verifyBankPromise: Promise<any>;

  constructor(
    protected apiService: ApiService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    private logService: LogService
  ) {}

  async ngOnInit() {
    await this.load();
    this.firstLoaded = true;
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    if (this.organizationId != null) {
      this.billing = await this.apiService.getOrganizationBilling(this.organizationId);
    } else {
      this.billing = await this.apiService.getUserBilling();
    }
    this.loading = false;
  }

  async verifyBank() {
    if (this.loading) {
      return;
    }

    try {
      const request = new VerifyBankRequest();
      request.amount1 = this.verifyAmount1;
      request.amount2 = this.verifyAmount2;
      this.verifyBankPromise = this.apiService.postOrganizationVerifyBank(
        this.organizationId,
        request
      );
      await this.verifyBankPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("verifiedBankAccount")
      );
      this.load();
    } catch (e) {
      this.logService.error(e);
    }
  }

  addCredit() {
    if (this.paymentSourceInApp) {
      this.platformUtilsService.showDialog(
        this.i18nService.t("cannotPerformInAppPurchase"),
        this.i18nService.t("addCredit"),
        null,
        null,
        "warning"
      );
      return;
    }
    this.showAddCredit = true;
  }

  closeAddCredit(load: boolean) {
    this.showAddCredit = false;
    if (load) {
      this.load();
    }
  }

  changePayment() {
    if (this.paymentSourceInApp) {
      this.platformUtilsService.showDialog(
        this.i18nService.t("cannotPerformInAppPurchase"),
        this.i18nService.t("changePaymentMethod"),
        null,
        null,
        "warning"
      );
      return;
    }
    this.showAdjustPayment = true;
  }

  closePayment(load: boolean) {
    this.showAdjustPayment = false;
    if (load) {
      this.load();
    }
  }

  get isCreditBalance() {
    return this.billing == null || this.billing.balance <= 0;
  }

  get creditOrBalance() {
    return Math.abs(this.billing != null ? this.billing.balance : 0);
  }

  get paymentSource() {
    return this.billing != null ? this.billing.paymentSource : null;
  }

  get paymentSourceInApp() {
    return (
      this.paymentSource != null &&
      (this.paymentSource.type === PaymentMethodType.AppleInApp ||
        this.paymentSource.type === PaymentMethodType.GoogleInApp)
    );
  }

  get invoices() {
    return this.billing != null ? this.billing.invoices : null;
  }

  get transactions() {
    return this.billing != null ? this.billing.transactions : null;
  }
}
