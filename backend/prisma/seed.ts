import prisma from '../src/config/database.js';

const categories = [

    { name: 'Plumbing', slug: 'plumbing', icon: 'Wrench' },
    { name: 'Electrical', slug: 'electrical', icon: 'Zap' },
    { name: 'Cleaning', slug: 'cleaning', icon: 'Sparkles' },
    { name: 'Carpentry', slug: 'carpentry', icon: 'Hammer' },
    { name: 'Painting', slug: 'painting', icon: 'Paintbrush' },
    { name: 'Water Systems', slug: 'water-systems', icon: 'Droplets' },
    { name: 'Waste Management', slug: 'waste-management', icon: 'Trash2' },
    { name: 'Gardening', slug: 'gardening', icon: 'Flower2' },
    { name: 'Locksmith', slug: 'locksmith', icon: 'Lock' },
    { name: 'Tiling & Flooring', slug: 'tiling-flooring', icon: 'Grid3x3' },
 
]

async function main () {
    const result = await prisma.serviceCategory.createMany({
        data: categories,
        skipDuplicates: true,
    });
    console.log(` ✅ Seeded ${result.count} service categories`);


}


main()
  .then(async () => {
   
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed :',e);
    await prisma.$disconnect();
    process.exit(1);
  });