import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { PageLoading } from "../components/common/UIComponents";

export function VerifyCertificate() {
  const { certificateId = "" } = useParams();
  const [state, setState] = useState<{
    loading: boolean;
    valid?: boolean;
    certificate?: {
      certificateNumber: string;
      studentName: string;
      courseTitle: string;
      instructorName: string;
      issuedAt: string;
    };
  }>({ loading: true });

  useEffect(() => {
    fetch(`/api/v1/certificates/${encodeURIComponent(certificateId)}/verify`)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) =>
        setState({ loading: false, valid: ok && data.valid, certificate: data.certificate })
      )
      .catch(() => setState({ loading: false, valid: false }));
  }, [certificateId]);

  return (
    <section className="verify-page wrap">
      {state.loading ? (
        <PageLoading />
      ) : state.valid && state.certificate ? (
        <div className="verify-card">
          <div className="verify-seal">
            <ShieldCheck size={29} />
          </div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> CERTIFICATE VERIFIED
          </div>
          <h1>
            A real piece
            <br />
            <em>of good work.</em>
          </h1>
          <p>This certificate was issued by Fieldnotes Learning Studio.</p>
          <div className="verify-details">
            <span>
              LEARNER<strong>{state.certificate.studentName}</strong>
            </span>
            <span>
              COURSE<strong>{state.certificate.courseTitle}</strong>
            </span>
            <span>
              INSTRUCTOR<strong>{state.certificate.instructorName}</strong>
            </span>
            <span>
              ISSUED
              <strong>
                {new Date(state.certificate.issuedAt).toLocaleDateString()}
              </strong>
            </span>
            <span>
              CERTIFICATE ID<strong>{state.certificate.certificateNumber}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="verify-card invalid">
          <div className="verify-seal">
            <X size={26} />
          </div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> NOT VERIFIED
          </div>
          <h1>
            We couldn’t find
            <br />
            <em>that certificate.</em>
          </h1>
          <p>The ID may be incorrect, or the certificate may have been revoked.</p>
          <Link to="/explore" className="button button-dark">
            Explore Fieldnotes <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
