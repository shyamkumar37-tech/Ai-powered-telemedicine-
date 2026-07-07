import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    full_journey: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "45s", target: 25 },
        { duration: "45s", target: 50 },
        { duration: "45s", target: 75 },
        { duration: "60s", target: 100 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api";
const EMAIL = __ENV.TEST_EMAIL || "patient@telecareplus.com";
const PASSWORD = __ENV.TEST_PASSWORD || "Password123";
const PATIENT_ID = Number(__ENV.PATIENT_ID || 1);
const DOCTOR_ID = Number(__ENV.DOCTOR_ID || 1);

function jsonHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function login() {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: jsonHeaders(), tags: { name: "login" } }
  );

  check(response, {
    "login status 200": (res) => res.status === 200,
    "login token present": (res) => Boolean(res.json("token")),
  });

  return response.json("token");
}

function futureAppointmentIso() {
  const now = new Date();
  now.setDate(now.getDate() + 5);
  now.setHours(10, 30, 0, 0);
  return now.toISOString().slice(0, 19);
}

export default function () {
  const token = login();
  if (!token) {
    return;
  }

  const doctorsResponse = http.get(`${BASE_URL}/doctors`, {
    headers: jsonHeaders(token),
    tags: { name: "get_doctors" },
  });

  check(doctorsResponse, {
    "doctor list status 200": (res) => res.status === 200,
  });

  const appointmentsResponse = http.get(`${BASE_URL}/appointments/patient/${PATIENT_ID}`, {
    headers: jsonHeaders(token),
    tags: { name: "get_patient_appointments" },
  });

  check(appointmentsResponse, {
    "appointment list status 200": (res) => res.status === 200,
  });

  const appointmentPayload = {
    patientId: PATIENT_ID,
    doctorId: DOCTOR_ID,
    appointmentDateTime: futureAppointmentIso(),
    mode: "TELECONSULTATION",
    concernSummary: "Stress test booking flow",
  };

  const bookingResponse = http.post(
    `${BASE_URL}/appointments`,
    JSON.stringify(appointmentPayload),
    {
      headers: jsonHeaders(token),
      tags: { name: "create_appointment" },
    }
  );

  check(bookingResponse, {
    "booking status acceptable": (res) => [200, 201, 400, 409].includes(res.status),
  });

  sleep(1);
}
