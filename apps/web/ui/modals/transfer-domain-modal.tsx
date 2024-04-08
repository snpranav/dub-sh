import useWorkspace from "@/lib/swr/use-workspace";
import useWorkspaces from "@/lib/swr/use-workspaces";
import { DomainProps } from "@/lib/types";
import { Button, InputSelect, InputSelectItemProps, Modal } from "@dub/ui";
import { APP_NAME, DICEBEAR_AVATAR_URL } from "@dub/utils";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import LinkLogo from "../links/link-logo";

function TransferDomainModal({
  showTransferDomainModal,
  setShowTransferDomainModal,
  props,
}: {
  showTransferDomainModal: boolean;
  setShowTransferDomainModal: Dispatch<SetStateAction<boolean>>;
  props: DomainProps;
}) {
  const { slug: domain } = props;

  const currentWorkspace = useWorkspace();
  const { workspaces } = useWorkspaces();
  const [transferring, setTransferring] = useState(false);
  const [selectedWorkspace, setselectedWorkspace] =
    useState<InputSelectItemProps | null>(null);

  const transferDomain = async (linkId: string, newWorkspaceId: string) => {
    return await fetch(
      `/api/domains/${domain}/transfer?workspaceId=${currentWorkspace.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newWorkspaceId }),
      },
    ).then(async (res) => {
      if (res.ok) {
        mutate(
          (key) => typeof key === "string" && key.startsWith("/api/domains"),
          undefined,
          { revalidate: true },
        );
        setShowTransferDomainModal(false);
        return true;
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    });
  };

  return (
    <Modal
      showModal={showTransferDomainModal}
      setShowModal={setShowTransferDomainModal}
      className="overflow-visible"
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (selectedWorkspace) {
            setTransferring(true);
            toast.promise(transferDomain(props.id, selectedWorkspace.id), {
              loading: "Transferring domain...",
              success:
                "Domain transfer initiated. We'll send you an email once it's complete.",
              error: "Failed to transfer domain.",
            });
          }
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-4 pt-8 text-center sm:px-16">
          <LinkLogo apexDomain={domain} />
          <h3 className="text-lg font-medium">Transfer {domain}</h3>
          <p className="text-sm text-gray-500">
            Transfer this domain and its links to another {APP_NAME} workspace.
            Link tags will not be transferred.
          </p>
        </div>
        <div className="flex flex-col space-y-28 bg-gray-50 px-4 py-8 text-left sm:space-y-3 sm:rounded-b-2xl sm:px-16">
          <InputSelect
            items={
              workspaces
                ? workspaces.map((workspace) => ({
                    id: workspace.id,
                    value: workspace.name,
                    image:
                      workspace.logo ||
                      `${DICEBEAR_AVATAR_URL}${workspace.name}`,
                    disabled: workspace.id === currentWorkspace.id,
                    label:
                      workspace.id === currentWorkspace.id ? "Current" : "",
                  }))
                : []
            }
            selectedItem={selectedWorkspace}
            setSelectedItem={setselectedWorkspace}
            inputAttrs={{
              placeholder: "Select a workspace",
            }}
          />
          <Button
            disabled={!selectedWorkspace}
            loading={transferring}
            text="Confirm transfer"
          />
        </div>
      </form>
    </Modal>
  );
}

export function useTransferDomainModal({ props }: { props: DomainProps }) {
  const [showTransferDomainModal, setShowTransferDomainModal] = useState(false);

  const TransferDomainModalCallback = useCallback(() => {
    return props ? (
      <TransferDomainModal
        showTransferDomainModal={showTransferDomainModal}
        setShowTransferDomainModal={setShowTransferDomainModal}
        props={props}
      />
    ) : null;
  }, [showTransferDomainModal, setShowTransferDomainModal]);

  return useMemo(
    () => ({
      setShowTransferDomainModal,
      TransferDomainModal: TransferDomainModalCallback,
    }),
    [setShowTransferDomainModal, TransferDomainModalCallback],
  );
}
