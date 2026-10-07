import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { MenuForm } from '@/components/menu/MenuForm';

export default function NewMenuPage() {
  return (
    <PageContainer
      title="Create New Menu Item"
      subtitle="Add dish details, pricing variants, and upload a picture"
    >
      <div className="max-w-3xl mx-auto">
        <MenuForm />
      </div>
    </PageContainer>
  );
}
