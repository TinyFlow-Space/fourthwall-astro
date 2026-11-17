import { useDocumentOperation, type DocumentActionComponent } from "sanity";

/**
 * Wraps the Publish action so republishing an already-published post stamps
 * `updatedAt` with the current time. First publication leaves it empty, and a
 * date the editor changed by hand in this draft is kept as-is.
 */
export function publishWithUpdatedAt(
  original: DocumentActionComponent,
): DocumentActionComponent {
  const PublishWithUpdatedAt: DocumentActionComponent = (props) => {
    const result = original(props);
    const { patch } = useDocumentOperation(props.id, props.type);
    if (!result) return result;
    return {
      ...result,
      onHandle: () => {
        const { draft, published } = props;
        if (draft && published && draft.updatedAt === published.updatedAt)
          patch.execute([{ set: { updatedAt: new Date().toISOString() } }]);
        result.onHandle?.();
      },
    };
  };
  PublishWithUpdatedAt.action = original.action;
  PublishWithUpdatedAt.displayName = "PublishWithUpdatedAt";
  return PublishWithUpdatedAt;
}
