import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { clubsRouter } from "./routes/clubs";
import { eventsRouter } from "./routes/events";
import { registrationsRouter } from "./routes/registrations";
import { checkinRouter } from "./routes/checkin";
import { facultyRouter } from "./routes/faculty";
import { certificatesRouter } from "./routes/certificates";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true, service: "konvene-api" }));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/clubs", clubsRouter);
app.use("/events", eventsRouter);
app.use("/", registrationsRouter); // exposes /events/:eventId/register and /registrations/:id
app.use("/checkin", checkinRouter);
app.use("/faculty", facultyRouter);
app.use("/", certificatesRouter); // exposes /events/:id/issue-certificates and /verify/:certId

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Konvene API listening on :${port}`));
