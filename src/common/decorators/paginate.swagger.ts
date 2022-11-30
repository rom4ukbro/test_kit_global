import { Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          models: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
            description: 'Chunk models on the page',
          },
          count: {
            type: 'number',
            description: 'Count of pages',
          },
        },
      },
    }),
  );
};
