import {
  apiSuccess,
  createRequestId,
} from "@/server/api/response";
import { adminApiError } from "@/server/admin/api";
import { getRequiredAdminSession } from "@/server/admin/auth";
import {
  listAdminAssets,
  listAdminLandingPages,
  listAdminLinkChecks,
  listAdminQRCodes,
  listAdminReviews,
  listAdminScans,
  listAdminUsers,
  listAdminWorkspaces,
  listPlatformUsers,
} from "@/server/admin/queries";
import {
  adminListQuerySchema,
  type AdminListQuery,
} from "@/server/admin/schemas";
import { AdminAccessError } from "@/server/admin/errors";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly resource: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRequestId(request);

  try {
    await getRequiredAdminSession();

    const { resource } = await context.params;
    const query = adminListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const page = await listAdminResource(resource, query);

    return apiSuccess({ data: page, requestId });
  } catch (error) {
    return adminApiError({
      error,
      requestId,
      fallbackCode: "ADMIN_RESOURCE_LIST_FAILED",
      fallbackMessage: "Could not load this admin resource.",
    });
  }
}

function listAdminResource(
  resource: string,
  query: AdminListQuery
) {
  switch (resource) {
    case "admin-users":
      return listAdminUsers(query);
    case "users":
      return listPlatformUsers(query);
    case "workspaces":
      return listAdminWorkspaces(query);
    case "qr-codes":
      return listAdminQRCodes(query);
    case "landing-pages":
      return listAdminLandingPages(query);
    case "assets":
      return listAdminAssets(query);
    case "scans":
      return listAdminScans(query);
    case "reviews":
      return listAdminReviews(query);
    case "link-checks":
      return listAdminLinkChecks(query);
    default:
      throw new AdminAccessError(
        "ADMIN_RESOURCE_NOT_FOUND",
        "This admin resource does not exist.",
        404
      );
  }
}
