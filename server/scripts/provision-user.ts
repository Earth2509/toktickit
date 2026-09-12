import "dotenv/config";
import { getPrisma } from "../src/prisma.js";
import { provisionMigratedUser } from "../src/provisioning.js";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.LAB3_PROVISION_MODE !== "local") {
    throw new Error("Set LAB3_PROVISION_MODE=local in a non-production environment before provisioning.");
  }

  const provisioned = await provisionMigratedUser(
    getPrisma(),
    process.env.LAB3_PROVISION_EMAIL,
    process.env.LAB3_PROVISION_PASSWORD,
  );
  console.log(`Provisioned ${provisioned.email}; the user must change this password after login.`);
}

main()
  .then(() => getPrisma().$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Unable to provision the user.");
    await getPrisma().$disconnect();
    process.exit(1);
  });
