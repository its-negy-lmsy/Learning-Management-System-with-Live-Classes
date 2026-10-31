import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";

export function CheckoutReturn() {
  const [params] = useSearchParams();

  return (
    <section className="wrap page-pad checkout-return">
      <div className="verify-seal">
        <Clock3 size={25} />
      </div>
      <div className="eyebrow">
        <span className="eyebrow-line" /> PAYMENT STATUS
      </div>
      <h1>
        {params.get("payment") === "cancelled"
          ? "No rush."
          : "Your checkout is complete."}
      </h1>
      <p>
        {params.get("payment") === "cancelled"
          ? "You can come back to this course whenever it feels right."
          : "We’re confirming the payment with the provider. Your course unlocks as soon as the verified confirmation arrives."}
      </p>
      <Link to="/dashboard" className="button button-dark">
        Go to my learning <ArrowRight size={15} />
      </Link>
    </section>
  );
}
