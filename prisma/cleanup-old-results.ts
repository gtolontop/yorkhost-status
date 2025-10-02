import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleanup script - DÉSACTIVÉ')
  console.log('❌ Ce script ne supprime plus les données automatiquement')
  console.log('ℹ️  Les données sont conservées indéfiniment')

  // DÉSACTIVÉ: Conservation permanente de toutes les données
  // Les données ne sont JAMAIS supprimées automatiquement

  console.log('✅ Aucune donnée supprimée (script désactivé)')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })