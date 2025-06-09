import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import ServiceCategories from '@/components/home/ServiceCategories';
import HowItWorks from '@/components/home/HowItWorks';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <ServiceCategories />
      <HowItWorks />
    </Layout>
  );
};

export default Index;
