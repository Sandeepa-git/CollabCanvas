import { BoardDashboard } from "@/components/BoardDashboard";
import { listBoards } from "@/lib/boardStore";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const boards = await listBoards();
  return <BoardDashboard initialBoards={boards} />;
}
