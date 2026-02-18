import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

# User Manual

<DocCardList items={useCurrentSidebarCategory().items} />
