import * as React from 'react';
import {
  Button,
  DataListAction,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  Dropdown,
  DropdownItem,
  Flex,
  FlexItem,
  KebabToggle,
  List,
  ListItem,
  Progress,
  Split,
  SplitItem,
  Switch,
  Title,
} from '@patternfly/react-core';
import '../DataProjects.scss';
import { ExternalLinkAltIcon, PlusCircleIcon } from '@patternfly/react-icons';
import {
  getNameVersionString,
  getTagDescription,
  getTagDependencies,
  getImageStreamByContainer,
} from '../../../utilities/imageUtils';
import { Container, ImageStream, ImageStreamTag, Notebook } from '../../../types';

type WorkspaceListItemProps = {
  dataKey: string;
  notebook: Notebook;
  imageStreams: ImageStream[];
  setModalOpen: (isOpen: boolean) => void;
  setActiveEnvironment: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
  handleListItemToggle: (id: string) => void;
  expandedItems: Set<string>;
};

const WorkspaceListItem: React.FC<WorkspaceListItemProps> = React.memo(
  ({
    dataKey,
    notebook,
    imageStreams,
    setModalOpen,
    setActiveEnvironment,
    onDelete,
    handleListItemToggle,
    expandedItems,
  }) => {
    const [isDropdownOpen, setDropdownOpen] = React.useState(false);
    const [isExpanded, setExpanded] = React.useState(expandedItems.has(dataKey));
    const [isNotebookRunning, setNotebookRunning] = React.useState(true);

    React.useEffect(() => {
      if (dataKey) {
        if (isExpanded !== expandedItems.has(dataKey)) {
          setExpanded(expandedItems.has(dataKey));
        }
      }
    }, [expandedItems, dataKey, isExpanded]);

    const empty = React.useCallback(
      () => (
        <DataListItem>
          <DataListItemRow>
            <DataListItemCells
              dataListCells={[
                <DataListCell key={`${dataKey}-unavailable`}>Workspace unavailable</DataListCell>,
              ]}
            />
            <DataListAction
              aria-label={`Workspace ${notebook.metadata.name} Delete`}
              aria-labelledby={`${dataKey}-delete`}
              id={`${dataKey}-delete`}
              isPlainButtonAction
            >
              <Button isInline onClick={() => onDelete(notebook)}>
                Delete
              </Button>
            </DataListAction>
          </DataListItemRow>
        </DataListItem>
      ),
      [dataKey, notebook, onDelete],
    );

    const containers: Container[] = notebook.spec?.template?.spec?.containers;
    const container: Container | undefined = containers.find(
      (container) => container.name === notebook.metadata.name,
    );
    if (!container) {
      return empty();
    }
    const imageStream: ImageStream | undefined = getImageStreamByContainer(imageStreams, container);
    const tag: ImageStreamTag | undefined = imageStream?.spec?.tags?.find(
      (tag) => tag.from.name === container.image,
    );
    if (!imageStream || !tag) {
      return empty();
    }

    const tagSoftware = getTagDescription(tag);
    const tagDependencies = getTagDependencies(tag);

    const getResourceAnnotation = (
      resource: Notebook | ImageStream,
      annotationKey: string,
    ): string => resource?.metadata.annotations?.[annotationKey] ?? '';

    const handleNotebookRunningChange = (isChecked: boolean) => {
      setNotebookRunning(isChecked);
    };

    const handleEdit = () => {
      setActiveEnvironment(notebook);
      setModalOpen(true);
    };

    const dropdownItems = [
      <DropdownItem onClick={handleEdit} key={`${dataKey}-edit`} component="button">
        Edit
      </DropdownItem>,
      <DropdownItem onClick={() => onDelete(notebook)} key={`${dataKey}-delete`} component="button">
        Delete
      </DropdownItem>,
    ];

    return (
      <DataListItem className="odh-data-projects__data-list-item" isExpanded={isExpanded}>
        <DataListItemRow>
          <DataListToggle
            onClick={() => handleListItemToggle(dataKey)}
            isExpanded={isExpanded}
            id={`${dataKey}-toggle`}
          />
          <DataListItemCells
            dataListCells={[
              <DataListCell width={5} key={`${dataKey}-name-descriptions`}>
                <Title size="md" headingLevel="h4">
                  {notebook.metadata.name}
                </Title>
                {getResourceAnnotation(notebook, 'opendatahub.io/description')}
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-image`}>
                {getResourceAnnotation(imageStream, 'opendatahub.io/notebook-image-name')}
                {tagSoftware && <p className="odh-data-projects__help-text">{tagSoftware}</p>}
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-gpu-size`}>
                Small (hardcoded)
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-status`}>
                <Switch
                  id={`${dataKey}-status-switch`}
                  label="Running"
                  labelOff="Stopped"
                  isChecked={isNotebookRunning}
                  onChange={handleNotebookRunningChange}
                  isDisabled={!isNotebookRunning}
                />
              </DataListCell>,
              <DataListCell width={1} key={`${dataKey}-open-external-link`}>
                <Button
                  isInline
                  variant="link"
                  icon={<ExternalLinkAltIcon />}
                  iconPosition="right"
                  isDisabled={!isNotebookRunning}
                >
                  <a
                    href={notebook.metadata.annotations?.['opendatahub.io/link'] ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                </Button>
              </DataListCell>,
            ]}
          />
          <DataListAction
            aria-label={`Workspace ${notebook.metadata.name} Action`}
            aria-labelledby={`${dataKey}-action`}
            id={`${dataKey}-action`}
            isPlainButtonAction
          >
            <Dropdown
              isPlain
              position="right"
              isOpen={isDropdownOpen}
              onSelect={() => setDropdownOpen(false)}
              toggle={<KebabToggle onToggle={(open) => setDropdownOpen(open)} />}
              dropdownItems={dropdownItems}
            />
          </DataListAction>
        </DataListItemRow>
        <DataListContent
          hasNoPadding
          aria-label={`Workspace ${notebook.metadata.name} Expanded Content`}
          id={`${dataKey}-expanded-content`}
          isHidden={!isExpanded}
        >
          <DataListItemCells
            className="odh-data-projects__data-list-item-content"
            dataListCells={[
              <DataListCell width={5} key={`${dataKey}-notebook-storage`}>
                <p className="m-bold">Storage</p>
                <List className="odh-data-projects__storage-progress" isPlain>
                  <ListItem>
                    <Flex>
                      <FlexItem>
                        <span>Enviro1_default_storage</span>
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        <Button variant="link" isSmall isInline>
                          Access
                        </Button>
                      </FlexItem>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Split hasGutter>
                      <SplitItem>
                        <span>1.75GB</span>
                      </SplitItem>
                      <SplitItem isFilled>
                        <Progress
                          aria-label={`${notebook.metadata.name} Storage Progress`}
                          measureLocation="outside"
                          value={87.5}
                          label="2GB"
                        />
                      </SplitItem>
                    </Split>
                  </ListItem>
                  <ListItem>
                    <Button variant="link" icon={<PlusCircleIcon />} isSmall isInline>
                      Add storage
                    </Button>
                  </ListItem>
                </List>
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-notebook-dependency`}>
                <p className="m-bold">Packages</p>
                {tagDependencies.length !== 0
                  ? tagDependencies.map((dependency, index) => (
                      <p key={`${dataKey}-dependency-${index}`}>
                        {getNameVersionString(dependency)}
                      </p>
                    ))
                  : null}
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-requests-limits`}>
                <p className="m-bold">Limits</p>
                <p>{`${container.resources.limits.cpu} CPU, ${container.resources.limits.memory}`}</p>
                <br />
                <p className="m-bold">Requests</p>
                <p>{`${container.resources.requests.cpu} CPU, ${container.resources.requests.memory}`}</p>
              </DataListCell>,
              <DataListCell width={2} key={`${dataKey}-content-empty-1`} />,
              <DataListCell width={1} key={`${dataKey}-content-empty-2`} />,
            ]}
          />
        </DataListContent>
      </DataListItem>
    );
  },
);

WorkspaceListItem.displayName = 'WorkspaceListItem';

export default WorkspaceListItem;