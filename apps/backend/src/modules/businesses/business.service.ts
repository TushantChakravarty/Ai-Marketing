import { BusinessModel, IBusiness } from './business.model';
import { CreateBusinessDto, UpdateBusinessDto, ConnectPlatformDto } from './business.types';
import { Platform } from '../../config/constants';

export class BusinessService {
  async create(ownerId: string, dto: CreateBusinessDto): Promise<IBusiness> {
    const business = await BusinessModel.create({ ...dto, owner: ownerId });
    return business;
  }

  async findByOwner(ownerId: string): Promise<IBusiness[]> {
    return BusinessModel.find({ owner: ownerId, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<IBusiness | null> {
    return BusinessModel.findById(id).exec();
  }

  async findByIdAndOwner(id: string, ownerId: string): Promise<IBusiness | null> {
    return BusinessModel.findOne({ _id: id, owner: ownerId }).exec();
  }

  async update(id: string, ownerId: string, dto: UpdateBusinessDto): Promise<IBusiness | null> {
    return BusinessModel.findOneAndUpdate(
      { _id: id, owner: ownerId },
      { $set: dto },
      { new: true, runValidators: true },
    ).exec();
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await BusinessModel.findOneAndDelete({ _id: id, owner: ownerId }).exec();
  }

  async connectPlatform(
    id: string,
    ownerId: string,
    dto: ConnectPlatformDto,
  ): Promise<IBusiness | null> {
    // Remove existing connection for this platform, then add new
    await BusinessModel.findOneAndUpdate(
      { _id: id, owner: ownerId },
      { $pull: { connectedPlatforms: { platform: dto.platform } } },
    ).exec();

    return BusinessModel.findOneAndUpdate(
      { _id: id, owner: ownerId },
      {
        $push: {
          connectedPlatforms: {
            platform: dto.platform,
            connectedAt: new Date(),
            platformUserId: dto.platformUserId,
            platformUsername: dto.platformUsername,
          },
        },
      },
      { new: true },
    ).exec();
  }

  async disconnectPlatform(
    id: string,
    ownerId: string,
    platform: Platform,
  ): Promise<IBusiness | null> {
    return BusinessModel.findOneAndUpdate(
      { _id: id, owner: ownerId },
      { $pull: { connectedPlatforms: { platform } } },
      { new: true },
    ).exec();
  }

  async countByOwner(ownerId: string): Promise<number> {
    return BusinessModel.countDocuments({ owner: ownerId });
  }
}

export const businessService = new BusinessService();
