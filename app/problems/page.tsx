// app/problems/page.tsx
import { getProblems } from './data';
import ProblemsClient from './ProblemsClient';

export default async function ProblemsPage() {
  const problems = await getProblems();

  return <ProblemsClient initialProblems={problems} />;
}