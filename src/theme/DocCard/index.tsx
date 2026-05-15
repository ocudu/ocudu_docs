// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import {usePluralForm} from '@docusaurus/theme-common';
import {translate} from '@docusaurus/Translate';

import type {Props} from '@theme/DocCard';
import Heading from '@theme/Heading';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';

import {
  BookOpen01,
  GraduationHat02,
  Lightbulb01,
  CodeBrowser,
  PackageCheck,
  Users01,
  Link01,
  CheckVerified01,
  File02,
} from '@untitled-ui/icons-react';

import styles from '@docusaurus/theme-classic/lib/theme/DocCard/styles.module.css';

type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<string, SvgIcon> = {
  '/user_manual/':    BookOpen01,
  '/tutorials/':      GraduationHat02,
  '/knowledge_base/': Lightbulb01,
  '/dev_guide/':      CodeBrowser,
  '/releases/':       PackageCheck,
  '/community/':      Users01,
  '/integrations/':   Link01,
  '/qa_results/':     CheckVerified01,
};

function CardIcon({href}: {href: string}): ReactNode {
  const match = Object.keys(ICON_MAP).find(prefix => href.startsWith(prefix));
  const Icon: SvgIcon = match ? ICON_MAP[match] : File02;
  return (
    <Icon
      width={18}
      height={18}
      stroke="currentColor"
      style={{verticalAlign: 'middle', marginRight: '0.4rem', flexShrink: 0, opacity: 0.8}}
    />
  );
}

function useCategoryItemsPlural() {
  const {selectMessage} = usePluralForm();
  return (count: number) =>
    selectMessage(
      count,
      translate(
        {
          message: '1 item|{count} items',
          id: 'theme.docs.DocCard.categoryDescription.plurals',
          description:
            'The default description for a category card in the generated index about how many items this category includes',
        },
        {count},
      ),
    );
}

function CardContainer({
  className,
  href,
  children,
}: {
  className?: string;
  href: string;
  children: ReactNode;
}): ReactNode {
  return (
    <Link
      href={href}
      className={clsx('card padding--lg', styles.cardContainer, className)}>
      {children}
    </Link>
  );
}

function CardLayout({
  className,
  href,
  title,
  description,
}: {
  className?: string;
  href: string;
  title: string;
  description?: string;
}): ReactNode {
  return (
    <CardContainer href={href} className={className}>
      <Heading
        as="h2"
        className={clsx('text--truncate', styles.cardTitle)}
        title={title}>
        <CardIcon href={href} />
        {title}
      </Heading>
      {description && (
        <p
          className={clsx('text--truncate', styles.cardDescription)}
          title={description}>
          {description}
        </p>
      )}
    </CardContainer>
  );
}

function CardCategory({item}: {item: PropSidebarItemCategory}): ReactNode {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useCategoryItemsPlural();

  if (!href) {
    return null;
  }

  return (
    <CardLayout
      className={item.className}
      href={href}
      title={item.label}
      description={item.description ?? categoryItemsPlural(item.items.length)}
    />
  );
}

function CardLink({item}: {item: PropSidebarItemLink}): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  return (
    <CardLayout
      className={item.className}
      href={item.href}
      title={item.label}
      description={item.description ?? doc?.description}
    />
  );
}

export default function DocCard({item}: Props): ReactNode {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
