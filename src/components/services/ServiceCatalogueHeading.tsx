export default function ServiceCatalogueHeading({ title, subtitle = "იპოვე ხელოსანი თბილისში, ბათუმში, ქუთაისში — შეფასებებითა და ფასებით" }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-3 md:mb-8">
      <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">{title}</h1>
      <p className="text-sm md:text-lg text-muted-foreground">{subtitle}</p>
    </div>
  );
}
