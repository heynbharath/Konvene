import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const dept = await prisma.department.create({
    data: { name: "School of Engineering", code: "ENG" },
  });

  const branch = await prisma.branch.create({
    data: { name: "Computer Science", code: "CSE", departmentId: dept.id },
  });

  const section = await prisma.section.create({
    data: { name: "A", year: 3, semester: 5, branchId: branch.id },
  });

  const subject = await prisma.subject.create({
    data: { name: "Compiler Design", code: "CS301", semester: 5, branchId: branch.id },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Ada Admin",
      email: "admin@konvene.dev",
      passwordHash,
      roleAssignments: { create: { role: "ADMIN", scopeType: "GLOBAL" } },
    },
  });

  const faculty = await prisma.user.create({
    data: {
      name: "Dr. Rao",
      email: "faculty@konvene.dev",
      passwordHash,
      roleAssignments: { create: { role: "FACULTY", scopeType: "SUBJECT", scopeId: subject.id } },
    },
  });

  await prisma.subjectFacultyAssignment.create({
    data: { subjectId: subject.id, sectionId: section.id, facultyUserId: faculty.id },
  });

  const clubHead = await prisma.user.create({
    data: {
      name: "Priya (Club Head)",
      email: "clubhead@konvene.dev",
      passwordHash,
      roleAssignments: { create: { role: "CLUB_HEAD", scopeType: "GLOBAL" } },
    },
  });

  const club = await prisma.club.create({
    data: {
      name: "Google Developer Student Club",
      slug: "gdsc",
      description: "Building with Google technologies, on campus.",
      departmentId: dept.id,
      facultyAdvisorName: "Dr. Rao",
      members: { create: { userId: clubHead.id, role: "CLUB_HEAD" } },
    },
  });
  await prisma.userRoleAssignment.create({
    data: { userId: clubHead.id, role: "CLUB_HEAD", scopeType: "CLUB", scopeId: club.id },
  });

  // Dr. Rao doubles as GDSC's Faculty Coordinator, so their approval gates the club's events.
  await prisma.userRoleAssignment.create({
    data: { userId: faculty.id, role: "FACULTY_COORDINATOR", scopeType: "CLUB", scopeId: club.id },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Arjun Student",
      email: "student1@konvene.dev",
      usn: "1CS21CS001",
      passwordHash,
      roleAssignments: { create: { role: "STUDENT", scopeType: "GLOBAL" } },
      studentProfile: { create: { sectionId: section.id, year: 3, semester: 5 } },
    },
  });
  const student2 = await prisma.user.create({
    data: {
      name: "Meera Student",
      email: "student2@konvene.dev",
      usn: "1CS21CS002",
      passwordHash,
      roleAssignments: { create: { role: "STUDENT", scopeType: "GLOBAL" } },
      studentProfile: { create: { sectionId: section.id, year: 3, semester: 5 } },
    },
  });

  const event = await prisma.event.create({
    data: {
      clubId: club.id,
      title: "Compiler Hackfest 2026",
      slug: "compiler-hackfest-2026",
      description: "A 24-hour hackathon building toy compilers, counted toward CS301 lab attendance.",
      category: "HACKATHON",
      venue: "Innovation Lab, Block 3",
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      capacity: 100,
      status: "PUBLISHED",
      requiresFacultyAttendance: true,
      linkedSubjectId: subject.id,
      ticketTypes: {
        create: [
          { name: "General", capacity: 80 },
          { name: "VIP", capacity: 20 },
        ],
      },
      form: {
        create: {
          schemaJson: JSON.stringify([
            { key: "githubUrl", label: "GitHub URL", type: "text", required: false },
            { key: "tshirtSize", label: "T-Shirt Size", type: "select", options: ["S", "M", "L", "XL"], required: true },
          ]),
        },
      },
    },
  });

  const pendingEvent = await prisma.event.create({
    data: {
      clubId: club.id,
      title: "Intro to Kotlin Workshop",
      slug: "intro-to-kotlin-workshop",
      description: "A hands-on beginner workshop on Kotlin for Android development. Awaiting coordinator approval.",
      category: "WORKSHOP",
      venue: "Seminar Hall 2",
      startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 50,
      status: "PENDING_APPROVAL",
      ticketTypes: { create: [{ name: "General", capacity: 50 }] },
      form: { create: { schemaJson: JSON.stringify([]) } },
    },
  });

  console.log("Seeded:", {
    admin: admin.email,
    faculty: faculty.email,
    clubHead: clubHead.email,
    students: [student1.email, student2.email],
    club: club.slug,
    event: event.slug,
    pendingApprovalEvent: pendingEvent.slug,
  });
  console.log("All demo accounts use password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
