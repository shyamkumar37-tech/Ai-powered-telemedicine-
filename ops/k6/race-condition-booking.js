import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 50,
  iterations: 50,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    checks: ["rate>0.99"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api";
const EMAIL = __ENV.TEST_EMAIL || "patient@telecareplus.com";
const PASSWORD = __ENV.TEST_PASSWORD || "Password123";
const PATIENT_ID = Number(__ENV.PATIENT_ID || 1);
const DOCTOR_ID = Number(__ENV.DOCTOR_ID || 1);
const FIXED_SLOT = __ENV.FIXED_SLOT || "2030-01-01T10:30:00";

function headers(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function login() {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "login" } }
  );
  return response.json("token");
}

export default function () {
  const token = login();
  if (!token) {
    return;
  }

  const response = http.post(
    `${BASE_URL}/appointments`,
    JSON.stringify({
      patientId: PATIENT_ID,
      doctorId: DOCTOR_ID,
      appointmentDateTime: FIXED_SLOT,
      mode: "TELECONSULTATION",
      concernSummary: "Race condition booking verification",
    }),
    {
      headers: headers(token),
      tags: { name: "race_booking" },
    }
  );

  check(response, {
    "same-slot booking returns success or conflict": (res) => [200, 201, 400, 409].includes(res.status),
  });
}
