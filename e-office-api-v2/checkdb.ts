import { Prisma } from './src/db/index';

const letters = await Prisma.letterInstance.findMany({
  where: { currentStep: 7 },
  select: {
    id: true,
    status: true,
    currentStep: true,
    values: true,
    stepHistory: {
      orderBy: { createdAt: 'asc' },
      select: { action: true, step: true, actorRole: true, createdAt: true }
    }
  }
});

for (const l of letters) {
  const name = (l.values as any)?.namaLengkap;
  console.log(`\n=== ${name} | status=${l.status} | step=${l.currentStep} ===`);
  for (const h of l.stepHistory) {
    console.log(`  [step${h.step}] ${h.action} by ${h.actorRole}`);
  }
}
