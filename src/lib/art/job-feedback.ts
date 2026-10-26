export function artJobFailureMessage(code: string | null): string {
  switch (code) {
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
