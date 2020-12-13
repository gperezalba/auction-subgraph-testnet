import { Auction, Factory, Token } from "../generated/schema"
import { NewAuction, NewCommission } from "../generated/AuctionFactory/AuctionFactory"
import { Auction as AuctionTemplate } from "../generated/templates"
import { BigInt } from "@graphprotocol/graph-ts";
import { createUserIfNull } from "./user";

export function handleNewAuction(event: NewAuction): void {
    let auction = Auction.load(event.params.newAuction.toHexString());

    if (auction == null) {
        auction = new Auction(event.params.newAuction.toHexString());
    }

    let tokens = event.params.tokens;
    let auctionToken = Token.load(tokens[0].toHexString());

    createUserIfNull(event.params.owner.toHexString());

    auction.owner = event.params.owner.toHexString();
    auction.auctionToken = auctionToken.id;
    auction.bidToken = tokens[1].toHexString();
    auction.auctionAmount = event.params.auctionAmountOrId;

    if (auctionToken.tokenKind == BigInt.fromI32(2)) {
        let collectableId = auctionToken.id.concat("-").concat(event.params.auctionAmountOrId.toString());
        auction.auctionCollectable = collectableId;
    } else if (auctionToken.tokenKind == BigInt.fromI32(3)) {
        auction.auctionPackable = event.params.auctionTokenId.toHexString();
    }

    let settings = event.params.settings;

    auction.category = auctionToken.tokenKind;
    auction.bidPrice = settings[0].div(BigInt.fromI32(10));
    auction.minValue = settings[0];
    auction.maxBid = settings[0];
    auction.startTime = event.block.timestamp;
    auction.endTime = settings[1];
    auction.auditor = event.params.auditor;
    auction.bids = [];
    auction.isOpen = false;
    auction.isClose = false;
    auction.isDealPaid = false;
    auction.isDealCancelled = false;
    auction.isKillable = false;
    auction.isKilled = false;

    if (auction.endTime == BigInt.fromI32(0)) {
        auction.endsByDate = false;
    } else {
        auction.endsByDate = true;
    }

    auction.save();

    AuctionTemplate.create(event.params.newAuction);
}

export function handleNewCommission(event: NewCommission): void {
    let factory = Factory.load(event.address.toHexString());

    if (factory == null) {
        factory = new Factory(event.address.toHexString());
    }

    factory.commission = event.params.newCommission;
    factory.save();
}