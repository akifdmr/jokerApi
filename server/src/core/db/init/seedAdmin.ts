import bcrypt from 'bcrypt'
import { UserModel } from '../models/User.model.js'
import { UserRole } from '../models/enums.js'

export const seedAdminUser = async () => {
  const adminExists = await UserModel.findOne({
    role: UserRole.SUPER_ADMIN
  })

  if (adminExists) return

  const hash = await bcrypt.hash('ChangeMe123!', 12)

  await UserModel.create({
    userName: 'superadmin',
    passwordHash: hash,
    role: UserRole.SUPER_ADMIN
  })

  console.log('👑 Super admin created')
}
