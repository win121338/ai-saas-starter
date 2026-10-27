export function artJobFailureMessage(code: string | null): string {
  switch (code) {
    case "provider_model_not_open":
      return "This image model is not activated for the service account. Your credit was refunded. Contact the site operator.";
    case "provider_authentication_failed":
      return "The image service credential was rejected. Your credit was refunded. Contact the site operator.";
    case "provider_access_denied":
      return "The image service account does not have permission to use this model. Your credit was refunded. Contact the site operator.";
    case "provider_model_not_found":
      return "The image model or endpoint does not exist or is not accessible to the service account. Your credit was refunded. Contact the site operator.";
    case "provider_account_unavailable":
      return "The image service account has a billing or account-status issue. Your credit was refunded. Contact the site operator.";
    case "insufficient_credits":
      return "Not enough credits were available. Nothing was charged.";
    case "charge_not_recorded":
      return "We could not confirm the credit charge. No credits were spent.";
    case "provider_unavailable":
      return "The image service is unavailable. Your credit was refunded. Please try again later.";
    case "provider_rejected_input":
      return "The image service rejected this edit. Your credit was refunded. Try another photo or style.";
    case "provider_processing_failed":
      return "The model could not finish this artwork. Your credit was refunded. Try another photo or style.";
    case "provider_rate_limit_timeout":
      return "The image service stayed busy too long. Your credit was refunded. Try again later.";
    case "mock_processing_failed":
      return "The local preview could not be created. Your credit was refunded.";
    default:
      return "This artwork could not be completed. Your credit was refunded.";
  }
}
