import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveBranch = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const branchHeader = request.headers['x-branch-id'] as string;
    const user = request.user;

    return branchHeader || user?.primaryBranchId;
  },
);
