import { User } from "../generated/schema";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { NameService, CreateName } from "../generated/NameService/NameService";
import { UpdateReputation } from "../generated/OffchainReputation/OffchainReputation";

export function handleCreateName(event: CreateName): void {
    createUserIfNull(event.params.wallet.toHexString());
}

export function createUserIfNull(userId: string): void {
    let user = User.load(userId);

    if (user == null) {
        user = new User(userId);
        user.auctions = [];
        user.bids = [];
        user.name = getNickname(userId);
        user.offchainReputation = BigInt.fromI32(0);
        user.auctionsAsOwner = BigInt.fromI32(0);
        user.biddedAuctions = BigInt.fromI32(0);
        user.totalBids = BigInt.fromI32(0);
        user.bidderGoodDeals = BigInt.fromI32(0);
        user.bidderBadDeals = BigInt.fromI32(0);

        user.save();
    }
}

export function getNickname(walletAddress: string): string {
    let nameService = NameService.bind(Address.fromString("0xa235C036b75413e68f373BCa100bF818423Ee5B6"));
    let name = nameService.try_name(Address.fromString(walletAddress));

    if (!name.reverted) {
        return name.value;
    } else {
        return "reverted";
    }
}

export function handleUpdateReputation(event: UpdateReputation): void {
    createUserIfNull(event.params.user .toHexString());
    let user = User.load(event.params.user.toHexString());
  
    user.offchainReputation = event.params.reputation;
  
    user.save();
  }
