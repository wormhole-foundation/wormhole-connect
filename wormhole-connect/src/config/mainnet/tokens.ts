import { Icon, TokensConfig } from '../types';

export const MAINNET_TOKENS: TokensConfig = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'ethereum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeChain: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x4DB5a66E937A9F4473fA95b1cAF1d1E1D62E29EA',
        decimals: 18,
      },
      polygon: {
        address: '0x11CD37bb86F65419713f30673A480EA33c826872',
        decimals: 18,
      },
      avalanche: {
        address: '0x8b82A291F83ca07Af22120ABa21632088fC92931',
        decimals: 18,
      },
      fantom: {
        address: '0x2A126f043BDEBe5A0A9841c51915E562D9B07289',
        decimals: 18,
      },
      celo: {
        address: '0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207',
        decimals: 18,
      },
      moonbeam: {
        address: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD',
        decimals: 18,
      },
      solana: {
        address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
        decimals: 8,
      },
      sui: {
        address:
          '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xcc8a89c8dce9693d354449f1f73e60e14e347417854f029db5bc8e7454008abb::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x71b35ECb35104773537f849FBC353F81303A5860',
        decimals: 18,
      },
      arbitrum: {
        address: '0xD8369C2EDA18dD6518eABb1F85BD60606dEb39Ec',
        decimals: 18,
      },
      optimism: {
        address: '0xb47bC3ed6D70F04fe759b2529c9bc7377889678f',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole18csycs4vm6varkp00apuqlsm7v4twg8jsljk8wfdd7cghr7g4rtslwqndm',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/62F82550D0B96522361C89B0DA1119DE262FBDFB25E5502BC5101B5C0D0DBAAC',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/4442A8E0D487A49E76EA6606F5DADCF8D0DBDD8499112340C964970DB745EDA2',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/7D9D28CABB49A4BB1A50C3B7E4544BFDBC5DDFAEB84A7787755A34CE7196CE15',
        decimals: 8,
      },
    },
  },
  USDCeth: {
    key: 'USDCeth',
    symbol: 'USDC',
    nativeChain: 'ethereum',
    icon: Icon.USDC,
    tokenId: {
      chain: 'ethereum',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    coinGeckoId: 'usd-coin',
    color: '#ffffff',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      bsc: {
        address: '0xB04906e95AB5D797aDA81508115611fee694c2b3',
        decimals: 6,
      },
      polygon: {
        address: '0x4318CB63A2b8edf2De971E2F17F77097e499459D',
        decimals: 6,
      },
      avalanche: {
        address: '0xB24CA28D4e2742907115fECda335b40dbda07a4C',
        decimals: 6,
      },
      fantom: {
        address: '0x2Ec752329c3EB419136ca5e4432Aa2CDb1eA23e6',
        decimals: 6,
      },
      celo: {
        address: '0x37f750B7cC259A2f741AF45294f6a16572CF5cAd',
        decimals: 6,
      },
      moonbeam: {
        address: '0x931715FEE2d06333043d11F658C8CE934aC61D0c',
        decimals: 6,
      },
      solana: {
        address: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM',
        decimals: 6,
      },
      sui: {
        address:
          '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T',
        decimals: 6,
      },
      base: {
        address: '0xec267C53f53807c2337C257f8AC3Fc3cC07cc0ed',
        decimals: 6,
      },
      arbitrum: {
        address: '0xC96F2715E2a242d50D1b0bC923dbe1740b8eCf18',
        decimals: 6,
      },
      optimism: {
        address: '0x711e53D031ea9B0bb0C24dD506df11b41AEA419e',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1utjx3594tlvfw4375esgu72wa4sdgf0q7x4ye27husf5kvuzp5rsr72gdq',
        decimals: 6,
      },
      evmos: {
        address:
          'ibc/0C19171CDC59451F91D2749CDEA63355532DCD5D8904CCBAC4953290E16AB8FD',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/6B99DB46AA9FF47162148C1726866919E44A6A5E0274B90912FD17E19A337695',
        decimals: 6,
      },
      kujira: {
        address:
          'ibc/C5EADE2C526B9629D230AC02A97644984ACB7C2F9A6C85126D1025CB0DA42588',
        decimals: 6,
      },
    },
  },
  WBTC: {
    key: 'WBTC',
    symbol: 'WBTC',
    nativeChain: 'ethereum',
    icon: Icon.WBTC,
    tokenId: {
      chain: 'ethereum',
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    coinGeckoId: 'wrapped-bitcoin',
    color: '#ffffff',
    decimals: {
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x43359676E1A3F9FbB5de095333f8e9c1B46dFA44',
        decimals: 8,
      },
      polygon: {
        address: '0x5D49c278340655B56609FdF8976eb0612aF3a0C3',
        decimals: 8,
      },
      avalanche: {
        address: '0x1C0e79C5292c59bbC13C9F9f209D204cf4d65aD6',
        decimals: 8,
      },
      fantom: {
        address: '0x87e9E225aD8a0755B9958fd95BE43DD6A91FF3A7',
        decimals: 8,
      },
      celo: {
        address: '0xd71Ffd0940c920786eC4DbB5A12306669b5b81EF',
        decimals: 8,
      },
      moonbeam: {
        address: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D',
        decimals: 8,
      },
      solana: {
        address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
        decimals: 8,
      },
      sui: {
        address:
          '0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T',
        decimals: 8,
      },
      base: {
        address: '0xE6396f780b543dF16ee3b784D789c75B68319db0',
        decimals: 8,
      },
      arbitrum: {
        address: '0x397846a8078d4845c7f5c6Ca76aeBbcFDc044fAe',
        decimals: 8,
      },
      optimism: {
        address: '0xB214C19d81c99E75e84706a3aa0A757319023e26',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1nz0r0au8aj6dc00wmm3ufy4g4k86rjzlr8wkf92cktdlps5lgfcqxnx9yk',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/46C5DA1CB61C5BAA8730ABA467ADD58DE0333B075CACE28BC87E64AE8C9CA051',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/E4CD61E1FA3EB04EF1BF924D676AB9FD55E84A0DCF4E78C11CCA0E14E5B42672',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/B2C7F21B604E3974A7DA5DAA9395905F2F3C85392F8A221CFDF62E4A9F4E48E4',
        decimals: 8,
      },
    },
  },
  USDT: {
    key: 'USDT',
    symbol: 'USDT',
    nativeChain: 'ethereum',
    icon: Icon.USDT,
    tokenId: {
      chain: 'ethereum',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
    coinGeckoId: 'tether',
    color: '#ffffff',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      bsc: {
        address: '0x524bC91Dc82d6b90EF29F76A3ECAaBAffFD490Bc',
        decimals: 6,
      },
      polygon: {
        address: '0x9417669fBF23357D2774e9D421307bd5eA1006d2',
        decimals: 6,
      },
      avalanche: {
        address: '0x9d228444FC4B7E15A2C481b48E10247A03351FD8',
        decimals: 6,
      },
      fantom: {
        address: '0x14BCb86aEed6a74D3452550a25D37f1c30AA0A66',
        decimals: 6,
      },
      celo: {
        address: '0x617f3112bf5397D0467D315cC709EF968D9ba546',
        decimals: 6,
      },
      moonbeam: {
        address: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f',
        decimals: 6,
      },
      solana: {
        address: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1',
        decimals: 6,
      },
      sui: {
        address:
          '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T',
        decimals: 6,
      },
      base: {
        address: '0xFf0C62A4979400841eFaA6faADb07Ac7d5C98b27',
        decimals: 6,
      },
      arbitrum: {
        address: '0xE4728F3E48E94C6DA2B53610E677cc241DAFB134',
        decimals: 6,
      },
      optimism: {
        address: '0xf6B4185FCf8aF291c0E3927fbEab7046b4f6A8CA',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1w27ekqvvtzfanfxnkw4jx2f8gdfeqwd3drkee3e64xat6phwjg0savgmhw',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/2108F2D81CBE328F371AD0CEF56691B18A86E08C3651504E42487D9EE92DDE9C',
        decimals: 6,
      },
      evmos: {
        address:
          'ibc/C9072A294F5649D64E87A6998DD750576881E454CACCDAF7376EFC0FA243808D',
        decimals: 6,
      },
    },
  },
  DAI: {
    key: 'DAI',
    symbol: 'DAI',
    nativeChain: 'ethereum',
    icon: Icon.DAI,
    tokenId: {
      chain: 'ethereum',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    },
    coinGeckoId: 'dai',
    color: '#FEFEFD',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x3413a030EF81a3dD5a302F4B4D11d911e12ed337',
        decimals: 18,
      },
      polygon: {
        address: '0x732EB1747ecCFC431fF19bc359ffc83755B1918c',
        decimals: 18,
      },
      avalanche: {
        address: '0xca319f81D147559e19A522A0a0310Dd43A96cA0F',
        decimals: 18,
      },
      fantom: {
        address: '0xEE786D3D73Ea645365c7248E4e40eDba08B1169F',
        decimals: 18,
      },
      celo: {
        address: '0x97926a82930bb7B33178E3c2f4ED1BFDc91A9FBF',
        decimals: 18,
      },
      moonbeam: {
        address: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD',
        decimals: 18,
      },
      solana: {
        address: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o',
        decimals: 8,
      },
      aptos: {
        address:
          '0x407a220699982ebb514568d007938d2447d33667e4418372ffec1ddb24491b6c::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x617Edadb51BfB43A44Bb91C7402129C23bA52381',
        decimals: 18,
      },
      arbitrum: {
        address: '0x5c4f2FEFB97F7DF09E762d95C83f0Ccf8bCe8234',
        decimals: 18,
      },
      optimism: {
        address: '0x098EA47D630b46df1E08e389e5e4466119c7dd30',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1chejx4qqtvwxy6684yrsmf6pylancxqhk3vsmtleg5ta3zrffljqfscg87',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/898ACF6F5DEBF535103BBD52E3E5B70A311AD097B198A152483F69290B4210C0',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/3CE8A3DE4AE5AE2B4B8C03B2B227CC284732EDC849E506615FF2AA3D8EB1BAFC',
        decimals: 8,
      },
    },
  },
  BUSD: {
    key: 'BUSD',
    symbol: 'BUSD',
    nativeChain: 'ethereum',
    icon: Icon.BUSD,
    tokenId: {
      chain: 'ethereum',
      address: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    },
    coinGeckoId: 'binance-usd',
    color: '#F0B90B',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x035de3679E692C471072d1A09bEb9298fBB2BD31',
        decimals: 18,
      },
      polygon: {
        address: '0x95ea750420da26bE1Ab0891e209e921bCd84763f',
        decimals: 18,
      },
      celo: {
        address: '0x1dd42c0785ca90B677adc2ABad01dfc5ECcD0b4d',
        decimals: 18,
      },
      moonbeam: {
        address: '0xa2284e1F98E4d0B7Eb6a6b4f3C57f1b209C755F3',
        decimals: 18,
      },
      solana: {
        address: '33fsBLA8djQm82RpHmE3SuVrPGtZBWNYExsEUeKX1HXX',
        decimals: 8,
      },
      aptos: {
        address:
          '0x77400d2f56a01bad2d7c8c6fa282f62647ce3c03f43f2a8742e47ea01a91e24a::coin::T',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1msyushf6d76u9wupuvm6jdvc0x4trmv5w5kxr0hyt7n9npp233usg7pkhm',
        decimals: 8,
      },
    },
  },
  MATIC: {
    key: 'MATIC',
    symbol: 'MATIC',
    nativeChain: 'polygon',
    icon: Icon.POLYGON,
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WMATIC',
  },
  WMATIC: {
    key: 'WMATIC',
    symbol: 'WMATIC',
    nativeChain: 'polygon',
    icon: Icon.POLYGON,
    tokenId: {
      chain: 'polygon',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x7c9f4C87d911613Fe9ca58b579f737911AAD2D43',
        decimals: 18,
      },
      bsc: {
        address: '0xc836d8dC361E44DbE64c4862D55BA041F88Ddd39',
        decimals: 18,
      },
      avalanche: {
        address: '0xf2f13f0B7008ab2FA4A2418F4ccC3684E49D20Eb',
        decimals: 18,
      },
      fantom: {
        address: '0xb88A6064B1F3FF5B9AE4A82fFD52560b0dF9FBD3',
        decimals: 18,
      },
      celo: {
        address: '0x9C234706292b1144133ED509ccc5B3CD193BF712',
        decimals: 18,
      },
      moonbeam: {
        address: '0x82DbDa803bb52434B1f4F41A6F0Acb1242A7dFa3',
        decimals: 18,
      },
      solana: {
        address: 'Gz7VkD4MacbEB6yC5XD3HcumEiYx2EtDYYrfikGsvopG',
        decimals: 8,
      },
      sui: {
        address:
          '0xdbe380b13a6d0f5cdedd58de8f04625263f113b3f9db32b3e1983f49e2841676::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x6781088e2a1629d38eda521467af4a8ca7bfa7e5516338017940389595c85c0f::coin::T',
        decimals: 8,
      },
      base: {
        address: '0xc863399E5c5C4011B1DC3fB602902C77BA72B709',
        decimals: 18,
      },
      arbitrum: {
        address: '0x3ab0E28C3F56616aD7061b4db38aE337E3809AEA',
        decimals: 18,
      },
      optimism: {
        address: '0x8f02B6a32cebcAe44D2Fd17d87966f5B5dD14c6d',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1xmpenz0ykxfy8rxr3yc3d4dtqq4dpas4zz3xl6sh873us3vajlpszn4ph7',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/03B6D1925A09B3033AA6FA8772202719ABDC51F8CC2A5C26D0A9B19832F2C023',
        decimals: 8,
      },
    },
  },
  WETHpolygon: {
    key: 'WETHpolygon',
    symbol: 'WETH',
    displayName: 'WETH (Polygon)',
    nativeChain: 'polygon',
    icon: Icon.ETH,
    tokenId: {
      chain: 'polygon',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    },
    coinGeckoId: 'ethereum',
    color: '#D53424',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  USDCpolygon: {
    key: 'USDCpolygon',
    symbol: 'USDC',
    nativeChain: 'polygon',
    icon: Icon.USDC,
    tokenId: {
      chain: 'polygon',
      address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      aptos: {
        address:
          '0xc5fd7820e9f053e6dd8e7dd8ca3ce8e9b10d200ba1692bdeb7a035217180ad4a::coin::T',
        decimals: 6,
      },
      base: {
        address: '0xFe1579BAc60363c8572CB30Bf4DD1Fd85811BBF8',
        decimals: 6,
      },
      moonbeam: {
        address: '0x4415BfBDee669446550d55c749007EF60B520FC8',
        decimals: 6,
      },
      sui: {
        address:
          '0x5c8c9082401982e8c2519a5c12883a5475295bf5cec4a0a13c26d35dd9a20d73::coin::COIN',
        decimals: 6,
      },
      bsc: {
        address: '0xe6d82Bbe75041E42E51d755e922cE1BA91af9c4d',
        decimals: 6,
      },
      celo: {
        address: '0x42c76808f3179A091Ee007A2955aF2522978ADE7',
        decimals: 6,
      },
      fantom: {
        address: '0xB4DcfD221048a1Dad989D39456BBd87762c26F06',
        decimals: 6,
      },
      avalanche: {
        address: '0xDb2d08f5A9C9ADBBA0DE5a69bbB1E9Ca03411692',
        decimals: 6,
      },
      arbitrum: {
        address: '0x599ADB10E6A012dF34935D47407450f6D7170e3C',
        decimals: 6,
      },
      optimism: {
        address: '0xbB1EaB9Eb8fDf65F0E291D013DA07B4b65a27a01',
        decimals: 6,
      },
    },
  },
  BNB: {
    key: 'BNB',
    symbol: 'BNB',
    nativeChain: 'bsc',
    icon: Icon.BNB,
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WBNB',
  },
  WBNB: {
    key: 'WBNB',
    symbol: 'WBNB',
    nativeChain: 'bsc',
    icon: Icon.BNB,
    tokenId: {
      chain: 'bsc',
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x418D75f65a02b3D53B2418FB8E1fe493759c7605',
        decimals: 18,
      },
      polygon: {
        address: '0xeCDCB5B88F8e3C15f95c720C51c71c9E2080525d',
        decimals: 18,
      },
      avalanche: {
        address: '0x442F7f22b1EE2c842bEAFf52880d4573E9201158',
        decimals: 18,
      },
      fantom: {
        address: '0xc033551e05907Ddd643AE14b6D4a9CA72BfF509B',
        decimals: 18,
      },
      celo: {
        address: '0xBf2554ce8A4D1351AFeB1aC3E5545AaF7591042d',
        decimals: 18,
      },
      moonbeam: {
        address: '0xE3b841C3f96e647E6dc01b468d6D0AD3562a9eeb',
        decimals: 18,
      },
      solana: {
        address: '9gP2kCy3wA1ctvYWQk75guqXuHfrEomqydHLtcTCqiLa',
        decimals: 8,
      },
      sui: {
        address:
          '0xb848cce11ef3a8f62eccea6eb5b35a12c4c2b1ee1af7755d02d7bd6218e8226f::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x6312bc0a484bc4e37013befc9949df2d7c8a78e01c6fe14a34018449d136ba86::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x7fdAa50d7399ac436943028edA6ed9a1BD89509f',
        decimals: 18,
      },
      arbitrum: {
        address: '0x7AF00405916D823eDb1121546EfA6F4972B51b84',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole169nr66h9gcsfljvsnxnqfjakskcjt6ac8f58wqjuagu79m540teqfvaal4',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/5394BB30B3C9BD1EE84C9531E5094DDE2490964F518CBE8A4C91F748CE559AF5',
        decimals: 8,
      },
      optimism: {
        address: '0x6A09fE65ACa27C12573F04aAFa290bD75497E1BC',
        decimals: 18,
      },
    },
  },
  USDCbnb: {
    key: 'USDCbnb',
    symbol: 'USDC',
    nativeChain: 'bsc',
    icon: Icon.USDC,
    tokenId: {
      chain: 'bsc',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x7cd167B101D2808Cfd2C45d17b2E7EA9F46b74B6',
        decimals: 18,
      },
      polygon: {
        address: '0x4B3a922c773BDCF3BA8f1A4FDAc2029E1D0E9868',
        decimals: 18,
      },
      avalanche: {
        address: '0x6145E8a910aE937913426BF32De2b26039728ACF',
        decimals: 18,
      },
      fantom: {
        address: '0x0FcbDAC44c67A43607D3E95886dB19871ADc985F',
        decimals: 18,
      },
      celo: {
        address: '0x9d9abAE97a9344e3854527b4efbB366a1564bfEb',
        decimals: 18,
      },
      moonbeam: {
        address: '0x7f433E22366E03a3758CE22cCf82887d828078f8',
        decimals: 18,
      },
      solana: {
        address: 'FCqfQSujuPxy6V42UvafBhsysWtEq1vhjfMN1PUbgaxA',
        decimals: 8,
      },
      sui: {
        address:
          '0x909cba62ce96d54de25bec9502de5ca7b4f28901747bbf96b76c2e63ec5f1cba::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x79a6ed7a0607fdad2d18d67d1a0e552d4b09ebce5951f1e5c851732c02437595::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x68E2b07F92ed506f92935d7359ECA84D5342dbb4',
        decimals: 18,
      },
      arbitrum: {
        address: '0x1a0590F951bc9C3818Ce75ba5Bbe92831b2cf57e',
        decimals: 18,
      },
      optimism: {
        address: '0x1C15057d1F3794C934a6cBC1f7EceE934050F219',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1g3acw7aumaj3r348cqn4kazrehlmn822w9p46sqwztnke27h3lysxj4ddr',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/8E08C01546EF346F7E9A3600DDBC88943ADF3B20A67F1F2DD7B83D85613BCCAB',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/B28ACEF11D063FA8B1DA73C2F7DA3A1CFCCBC13E96B671698D4860E9367B55BB',
        decimals: 8,
      },
    },
  },
  AVAX: {
    key: 'AVAX',
    symbol: 'AVAX',
    nativeChain: 'avalanche',
    icon: Icon.AVAX,
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WAVAX',
  },
  WAVAX: {
    key: 'WAVAX',
    symbol: 'WAVAX',
    nativeChain: 'avalanche',
    icon: Icon.AVAX,
    tokenId: {
      chain: 'avalanche',
      address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    },
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x85f138bfEE4ef8e540890CFb48F620571d67Eda3',
        decimals: 18,
      },
      bsc: {
        address: '0x96412902aa9aFf61E13f085e70D3152C6ef2a817',
        decimals: 18,
      },
      polygon: {
        address: '0x7Bb11E7f8b10E9e571E5d8Eace04735fDFB2358a',
        decimals: 18,
      },
      fantom: {
        address: '0x358CE030DC6116Cc296E8B9F002728e65459C146',
        decimals: 18,
      },
      celo: {
        address: '0xFFdb274b4909fC2efE26C8e4Ddc9fe91963cAA4d',
        decimals: 18,
      },
      moonbeam: {
        address: '0xd4937A95BeC789CC1AE1640714C61c160279B22F',
        decimals: 18,
      },
      solana: {
        address: 'KgV1GvrHQmRBY8sHQQeUKwTm2r2h8t4C8qt12Cw1HVE',
        decimals: 8,
      },
      sui: {
        address:
          '0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x5b1bbc25524d41b17a95dac402cf2f584f56400bf5cc06b53c36b331b1ec6e8f::coin::T',
        decimals: 8,
      },
      base: {
        address: '0xc449A60A31E1eebFE83c42E9465fd4Dc318aE9a7',
        decimals: 18,
      },
      arbitrum: {
        address: '0x565609fAF65B92F7be02468acF86f8979423e514',
        decimals: 18,
      },
      optimism: {
        address: '0x8418C1d909842f458c9394886b83F19d62bF1A0D',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1ml922hnp59jtq9a87arekvx60ezehwlg2v3j5pduplwkenfa68ksgmzxwr',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/28E7241F6508EB4692C721E91201377323796EF2758CCD83D220A40EAD32601E',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/2EA2FE172078576E62DA20F14EEED12B26611D93150FE1D68E1AAE00479AC335',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/22B44C7369EED16089B9840ADE399B80D9483B4E459E67643C96C681D7C463D0',
        decimals: 8,
      },
    },
  },
  USDCavax: {
    key: 'USDCavax',
    symbol: 'USDC',
    nativeChain: 'avalanche',
    icon: Icon.USDC,
    tokenId: {
      chain: 'avalanche',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      ethereum: {
        address: '0x39EbF69137D98FB7659Ef8D4ea21ec26394389d7',
        decimals: 6,
      },
      bsc: {
        address: '0xc88Dc63bf0c8c8198C97Db0945E3eF25Ca89A8e4',
        decimals: 6,
      },
      polygon: {
        address: '0xAEA5CC14DefbC1b845FDE729E563B717Ee6825ae',
        decimals: 6,
      },
      fantom: {
        address: '0xEfE7701cb2B80664385Be226d0300912CA92f66A',
        decimals: 6,
      },
      celo: {
        address: '0x62FFf2D2D1692D52eAf043AeeC727F7918d269D3',
        decimals: 6,
      },
      moonbeam: {
        address: '0xd4918c40cA9f02d42Cb53d06587aF42017Bc345D',
        decimals: 6,
      },
      solana: {
        address: 'FHfba3ov5P3RjaiLVgh8FTv4oirxQDoVXuoUUDvHuXax',
        decimals: 6,
      },
      sui: {
        address:
          '0xe596782fbaebef51ae99ffac8731aed98a80642b9dc193ed659c97fbc2cc0f84::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0x39d84c2af3b0c9895b45d4da098049e382c451ba63bec0ce0396ff7af4bb5dff::coin::T',
        decimals: 6,
      },
      arbitrum: {
        address: '0x93e0FcbEd43CD6fC30DF00CcBD4669718dc74e77',
        decimals: 6,
      },
      optimism: {
        address: '0x355f0a8a7ecAeD971b8Fbd50994558291ff2413a',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1gwm6mrnse9atzf4mer4dnrz64mp6pa75wpsxywu8gymt9fwsk46sfr372u',
        decimals: 6,
      },
      kujira: {
        address:
          'ibc/F9F41DB8DA49EA6AB9EB4B2C9E0ECDC2502ABDA2FE728B85994BF31240CBC163',
        decimals: 6,
      },
      evmos: {
        address:
          'ibc/39913E647C3549D663B1ED7F0745E1779515170C5215B98B2C8410B4C073AD30',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/0B3C3D06228578334B66B57FBFBA4033216CEB8119B27ACDEE18D92DA5B28D43',
        decimals: 6,
      },
      base: {
        address: '0xD83385fE100E20c269a5975D4Bf92525BcE09F87',
        decimals: 6,
      },
    },
  },
  FTM: {
    key: 'FTM',
    symbol: 'FTM',
    nativeChain: 'fantom',
    icon: Icon.FANTOM,
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WFTM',
  },
  WFTM: {
    key: 'WFTM',
    symbol: 'WFTM',
    nativeChain: 'fantom',
    icon: Icon.FANTOM,
    tokenId: {
      chain: 'fantom',
      address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    },
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x4cD2690d86284e044cb63E60F1EB218a825a7e92',
        decimals: 18,
      },
      bsc: {
        address: '0xbF8413EE8612E0E4f66Aa63B5ebE27f3C5883d47',
        decimals: 18,
      },
      polygon: {
        address: '0x3726831304D77f585f1Aca9d9841cc3Ef80dAa62',
        decimals: 18,
      },
      avalanche: {
        address: '0xd19abc09B7b36F7558929b97a866f499a26c2f83',
        decimals: 18,
      },
      celo: {
        address: '0xd1A342eE2210238233a347FEd61EE7Faf9f251ce',
        decimals: 18,
      },
      moonbeam: {
        address: '0x609AedD990bf45926bca9E4eE988b4Fb98587D3A',
        decimals: 18,
      },
      solana: {
        address: 'DRQBDBEWmwWGK13fRTLhSPzjbvMSUavhV6nW4RUH8W6T',
        decimals: 8,
      },
      sui: {
        address:
          '0x6081300950a4f1e2081580e919c210436a1bed49080502834950d31ee55a2396::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xd1aa2ff36a0e93e1b4e4fecdecf8bb95bc5de399061c5e84b515281f48718842::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x936Fa2DE8380Dc5BF34C80F1BaD53a9f3630263B',
        decimals: 18,
      },
      arbitrum: {
        address: '0x7f7dcDb91930033a4Eb269196EBb6fd5f0644E4B',
        decimals: 18,
      },
      optimism: {
        address: '0x0b0ecbe5C3995541876d27633B63296570FB34Af',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1e0cwfmla7exa578xddl87paxexw9ymwrzysfjms8c2mstxjkldlqn45jqa',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/9EFE5F5D75A87197DD257BA7A96A3BCCEC9DB59D257C742FB5AA9D3DF612D476',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/397DFE63D87F6940ECA583DFF5461E48BF0BA6554CBBE70278E307DDFDC8E9D5',
        decimals: 8,
      },
    },
  },
  CELO: {
    key: 'CELO',
    symbol: 'CELO',
    nativeChain: 'celo',
    icon: Icon.CELO,
    tokenId: {
      chain: 'celo',
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
    },
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x3294395e62F4eB6aF3f1Fcf89f5602D90Fb3Ef69',
        decimals: 18,
      },
      bsc: {
        address: '0x2A335e327a55b177f5B40132fEC5D7298aa0D7e6',
        decimals: 18,
      },
      polygon: {
        address: '0x922F49a9911effc034eE756196E59BE7b90D43b3',
        decimals: 18,
      },
      avalanche: {
        address: '0x494317B8521c5a5287a06DEE467dd6fe285dA4a8',
        decimals: 18,
      },
      fantom: {
        address: '0xF432490C6c96C9d3bF523a499a1CEaFd8208A373',
        decimals: 18,
      },
      moonbeam: {
        address: '0xc1a792041985F65c17Eb65E66E254DC879CF380b',
        decimals: 18,
      },
      solana: {
        address: '9kvAcwQbqejuJMd59mKuw2bfSsLRaQ7zuvaTVHEeBBec',
        decimals: 8,
      },
      sui: {
        address:
          '0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xac0c3c35d50f6ef00e3b4db6998732fe9ed6331384925fe8ec95fcd7745a9112::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x74df3823aA29D278cAD0A3632fCB56C896a38eD4',
        decimals: 18,
      },
      arbitrum: {
        address: '0x4E51aC49bC5e2d87e0EF713E9e5AB2D71EF4F336',
        decimals: 18,
      },
      optimism: {
        address: '0x9b88D293b7a791E40d36A39765FFd5A1B9b5c349',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1kqey3a6k26kyensq7elcpx229tlj4d3qlshwhjq5xjm8dcdvu60qtef8k9',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/83300733052AB5F6E0F0C221E24189B6DF26CC94C73D2F44627627F9DEF4A9C8',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/4ACD155D71182398277CBD2C630A7C8C5F0F16FFF77965FDE4C845A4CDE2D60C',
        decimals: 8,
      },
    },
  },
  GLMR: {
    key: 'GLMR',
    symbol: 'GLMR',
    nativeChain: 'moonbeam',
    icon: Icon.GLMR,
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WGLMR',
  },
  WGLMR: {
    key: 'WGLMR',
    symbol: 'WGLMR',
    nativeChain: 'moonbeam',
    icon: Icon.GLMR,
    tokenId: {
      chain: 'moonbeam',
      address: '0xAcc15dC74880C9944775448304B263D191c6077F',
    },
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x93d3696A9F879b331f40CB5059e37015423A3Bd0',
        decimals: 18,
      },
      bsc: {
        address: '0x1C063db3c621BF901FC6C1D03328b08b2F9bbfba',
        decimals: 18,
      },
      polygon: {
        address: '0xcC48d6CF842083fEc0E01d913fB964b585975F05',
        decimals: 18,
      },
      avalanche: {
        address: '0x375aA6C67BF499fBf01804A9f92C03c0776F372d',
        decimals: 18,
      },
      fantom: {
        address: '0xBF227E92D6754EB4BFE26C40cb299ff2809Da45f',
        decimals: 18,
      },
      celo: {
        address: '0x383A5513AbE4Fe36e0E00d484F710148E348Aa9D',
        decimals: 18,
      },
      solana: {
        address: '7ixSaXGsHAFy34wogPk2YXiUX3BMmQMFdercdaHLnBby',
        decimals: 8,
      },
      sui: {
        address:
          '0x66f87084e49c38f76502d17f87d17f943f183bb94117561eb573e075fdc5ff75::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x7ab1283a7b13c4254d4e1f803d7ce6578442c1d7a40d0faee41cd48ba4884c8a::coin::T',
        decimals: 8,
      },
      base: {
        address: '0xfdB7311BeC3b2CcCF8407d0585f81B97b3b5eff1',
        decimals: 18,
      },
      arbitrum: {
        address: '0x944C5b67a03e6Cb93Ae1E4B70081f13b04CDB6Bd',
        decimals: 18,
      },
      optimism: {
        address: '0xbffD46DFDb8d3a02b8D2E0F864a2cD712090a4D3',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1gzuv84xrwwhxhf0f62av279vfyrfrm7x58fcnadlr5m90gnx223ses2st0',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/0F2941B0168D8DB77DA1B6A2D3A95EC04026D3C97FA3BFE8FD1D5D3F983AA518',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/3D337ECC89A8421DD6F33C4B7DDE9D4A18D728A4A688BA30E41F466EC8DD3869',
        decimals: 8,
      },
    },
  },
  SOL: {
    key: 'SOL',
    symbol: 'SOL',
    nativeChain: 'solana',
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Solana: 9,
      default: 8,
    },
    wrappedAsset: 'WSOL',
  },
  WSOL: {
    key: 'WSOL',
    symbol: 'WSOL',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'So11111111111111111111111111111111111111112',
    },
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Solana: 9,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0xD31a59c85aE9D8edEFeC411D448f90841571b89c',
        decimals: 9,
      },
      bsc: {
        address: '0xfA54fF1a158B5189Ebba6ae130CEd6bbd3aEA76e',
        decimals: 9,
      },
      polygon: {
        address: '0xd93f7E271cB87c23AaA73edC008A79646d1F9912',
        decimals: 9,
      },
      avalanche: {
        address: '0xFE6B19286885a4F7F55AdAD09C3Cd1f906D2478F',
        decimals: 9,
      },
      fantom: {
        address: '0xd99021C2A33e4Cf243010539c9e9b7c52E0236c1',
        decimals: 9,
      },
      celo: {
        address: '0x4581E64115d46CcdeE65Be2336bEc86c9BA54C01',
        decimals: 9,
      },
      moonbeam: {
        address: '0x99Fec54a5Ad36D50A4Bba3a41CAB983a5BB86A7d',
        decimals: 9,
      },
      sui: {
        address:
          '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xdd89c0e695df0692205912fb69fc290418bed0dbe6e4573d744a6d5e6bab6c13::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x1C61629598e4a901136a81BC138E5828dc150d67',
        decimals: 9,
      },
      arbitrum: {
        address: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07',
        decimals: 9,
      },
      optimism: {
        address: '0xba1Cf949c382A32a09A17B2AdF3587fc7fA664f1',
        decimals: 9,
      },
      wormchain: {
        address:
          'wormhole1wn625s4jcmvk0szpl85rj5azkfc6suyvf75q6vrddscjdphtve8sca0pvl',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/E5CA126979E2FFB4C70C072F8094D07ECF27773B37623AD2BF7582AD0726F0F3',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/1E43D59E565D41FB4E54CA639B838FFD5BCFC20003D330A56CB1396231AA1CBA',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/4443218F584A7AB2DFBCF93872D6E5B6967A11C53515DDF45A2CF387C54BD73A',
        decimals: 8,
      },
    },
  },
  USDCsol: {
    key: 'USDCsol',
    symbol: 'USDC',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    icon: Icon.USDC,
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      ethereum: {
        address: '0x41f7B8b9b897276b7AAE926a9016935280b44E97',
        decimals: 6,
      },
      bsc: {
        address: '0x91Ca579B0D47E5cfD5D0862c21D5659d39C8eCf0',
        decimals: 6,
      },
      polygon: {
        address: '0x576Cf361711cd940CD9C397BB98C4C896cBd38De',
        decimals: 6,
      },
      avalanche: {
        address: '0x0950Fc1AD509358dAeaD5eB8020a3c7d8b43b9DA',
        decimals: 6,
      },
      fantom: {
        address: '0xb8398DA4FB3BC4306B9D9d9d13d9573e7d0E299f',
        decimals: 6,
      },
      celo: {
        address: '0x8B6eef6C449D3Ac723a9C06a9eaE2dCd7d308BA9',
        decimals: 6,
      },
      moonbeam: {
        address: '0x098d6eE48341D6a0a0A72dE5baaF80A10E0F6082',
        decimals: 6,
      },
      sui: {
        address:
          '0xb231fcda8bbddb31f2ef02e6161444aec64a514e2c89279584ac9806ce9cf037::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xc91d826e29a3183eb3b6f6aa3a722089fdffb8e9642b94c5fcd4c48d035c0080::coin::T',
        decimals: 6,
      },
      arbitrum: {
        address: '0x3870546cfd600ba87e4180686d29dC993A45d3B7',
        decimals: 6,
      },
      optimism: {
        address: '0x6F974A6dfD5B166731704Be226795901c45Bb815',
        decimals: 6,
      },
      base: {
        address: '0xe8CE40EBBB844142400D21558a2F1c9683d69139',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole17fr8awnysyv3nt5je4strczdupssl8u9jqam890jfv72sh32yyqqhtg3ry',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/F08DE332018E8070CC4C68FE06E04E254F527556A614F5F8F9A68AF38D367E45',
        decimals: 6,
      },
    },
  },
  SUI: {
    key: 'SUI',
    symbol: 'SUI',
    nativeChain: 'sui',
    tokenId: {
      chain: 'sui',
      address: '0x2::sui::SUI',
    },
    icon: Icon.SUI,
    coinGeckoId: 'sui',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Sui: 9,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x84074EA631dEc7a4edcD5303d164D5dEa4c653D6',
        decimals: 9,
      },
      bsc: {
        address: '0x8314f6Bf1B4dd8604A0fC33C84F9AF2fc07AABC8',
        decimals: 9,
      },
      polygon: {
        address: '0x34bE049fEbfc6C64Ffd82Da08a8931A9a45f2cc8',
        decimals: 9,
      },
      avalanche: {
        address: '0x1703CB0F762D2a435199B64Ea47E5349B7C17480',
        decimals: 9,
      },
      fantom: {
        address: '0xC277423a21F6e32D886BF85Ef6cCB945d5D28347',
        decimals: 9,
      },
      celo: {
        address: '0x1Cb9859B1A16A67ef83A0c7b9A21eeC17d9a97Dc',
        decimals: 9,
      },
      moonbeam: {
        address: '0x484eCCE6775143D3335Ed2C7bCB22151C53B9F49',
        decimals: 9,
      },
      solana: {
        address: 'G1vJEgzepqhnVu35BN4jrkv3wVwkujYWFFCxhbEZ1CZr',
        decimals: 8,
      },
      aptos: {
        address:
          '0xa72a97e872be9ee3d2f14d56fd511eb7e4a53f4055be3a267d8602e7685b41c0::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x36c6FBF7B49bF65f5F82b674af219C05b2a4aDD1',
        decimals: 9,
      },
      arbitrum: {
        address: '0xCF79d86B8a830030aF6D835737d6eac3bE823fD7',
        decimals: 9,
      },
      optimism: {
        address: '0x27A533e438892DA192725b4C9AcA51447F457212',
        decimals: 9,
      },
      wormchain: {
        address:
          'wormhole19hlynxzedrlqv99v6qscww7d3crhl86qtd0vprpltg5g9xx6jk9q6ya33y',
        decimals: 8,
      },
      kujira: {
        address:
          'ibc/EBA52E7239CC1BC7F8ECF4F41523B6DD477FF067FD953315704A9A4FD2131B48',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/B1C287C2701774522570010EEBCD864BCB7AB714711B3AA218699FDD75E832F5',
        decimals: 8,
      },
    },
  },
  APT: {
    key: 'APT',
    symbol: 'APT',
    nativeChain: 'aptos',
    tokenId: {
      chain: 'aptos',
      address: '0x1::aptos_coin::AptosCoin',
    },
    icon: Icon.APT,
    coinGeckoId: 'aptos',
    color: '#8457EF',
    decimals: {
      Ethereum: 8,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x8CDf7AF57E4c8B930e1B23c477c22f076530585e',
        decimals: 8,
      },
      bsc: {
        address: '0x2Ba98cf7Edd2c5C794e21bc3Dc6973D3C2585eE3',
        decimals: 8,
      },
      polygon: {
        address: '0xa4ef199d3ad524E9C3C51Ac46B303B103A307Cef',
        decimals: 8,
      },
      avalanche: {
        address: '0x43c588459b3243fA541B98CC4B2E995b3de553A2',
        decimals: 8,
      },
      fantom: {
        address: '0x3Cd9162Ca5256b8E26A0e3Ad14CCfF7C0Da0F174',
        decimals: 8,
      },
      celo: {
        address: '0x89F2b718Ca518db39d377F0ABBa6B42582b549F7',
        decimals: 8,
      },
      moonbeam: {
        address: '0x25331575641d35D9765e1934acC8F0991c58e904',
        decimals: 8,
      },
      solana: {
        address: '6LNeTYMqtNm1pBFN8PfhQaoLyegAH8GD32WmHU9erXKN',
        decimals: 8,
      },
      sui: {
        address:
          '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN',
        decimals: 8,
      },
      base: {
        address: '0x1d36126289Be1658297A35CC3EB2BB80A7D7A04b',
        decimals: 8,
      },
      arbitrum: {
        address: '0x4EdeF400eDe5309240814b5FC403F224504604e9',
        decimals: 8,
      },
      optimism: {
        address: '0xC5B3AC2DF8D8D7AC851F763a5b3Ff23B4A696d59',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1f9sxjn0qu8xylcpzlvnhrefnatndqxnrajfrnr5h97hegnmsdqhsh6juc0',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/A4D176906C1646949574B48C1928D475F2DF56DE0AC04E1C99B08F90BC21ABDE',
        decimals: 8,
      },
    },
  },
  ETHarbitrum: {
    key: 'ETHarbitrum',
    symbol: 'ETH',
    displayName: 'ETH (Arbitrum)',
    nativeChain: 'arbitrum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHarbitrum',
  },
  WETHarbitrum: {
    key: 'WETHarbitrum',
    symbol: 'WETH',
    displayName: 'WETH (Arbitrum)',
    nativeChain: 'arbitrum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'arbitrum',
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0xb945E3F853B5f8033C8513Cf3cE9F8AD9beBB1c9',
        decimals: 18,
      },
      bsc: {
        address: '0xaA1eEdABC48D078350ccBdD620bD088848e299E5',
        decimals: 18,
      },
      polygon: {
        address: '0x6a5c59AB16268d2c872916054C50440B999e417C',
        decimals: 18,
      },
      avalanche: {
        address: '0xDfDA518A1612030536bD77Fd67eAcbe90dDC52Ab',
        decimals: 18,
      },
      fantom: {
        address: '0xE8367853A0823515D37b1538331B4704089becb4',
        decimals: 18,
      },
      celo: {
        address: '0xc6F962fCcb140ece554AfD0E589f971532A57f14',
        decimals: 18,
      },
      solana: {
        address: 'CSD6JQMvLi46psjHdpfFdr826mF336pEVMJgjwcoS1m4',
        decimals: 8,
      },
      sui: {
        address:
          '0x33744e7df340a4d01c23f6b18c13563f767545ea95f976f8045f056358419da3::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x0e977796d7bfb3263609b90dffd264c7bd078ce35dac42b55302858d9fa3452b::coin::T',
        decimals: 8,
      },
      base: {
        address: '0x9D36e0edb8BBaBeec5edE8a218dc2B9a6Fce494F',
        decimals: 18,
      },
      optimism: {
        address: '0x825206E1D29456337769e6f1384101E997C6A732',
        decimals: 18,
      },
      moonbeam: {
        address: '0x18872b45c603eD2EbC508b9C5514a85c2e2791FB',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole18nlwscr7290j463vcptqlgqudycry2rdnw2ysltpc2nqefk3353s808rl9',
        decimals: 8,
      },
      evmos: {
        address:
          'ibc/9E2E7B4A53409267CD686F4EB67969C2602A0F5FF9BDB1082B00E71CC4815DDE',
        decimals: 8,
      },
    },
  },
  USDCarbitrum: {
    key: 'USDCarbitrum',
    symbol: 'USDC',
    nativeChain: 'arbitrum',
    icon: Icon.USDC,
    tokenId: {
      chain: 'arbitrum',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      ethereum: {
        address: '0xCFc006a32a98031C2338BF9d5ff8ED2c0Cae4a9e',
        decimals: 6,
      },
      bsc: {
        address: '0x5caa170b465122D15a6D20FD9A804a9613CE7882',
        decimals: 6,
      },
      polygon: {
        address: '0x7800FE8951cdc1cDea748d878fAce63018D97960',
        decimals: 6,
      },
      avalanche: {
        address: '0x4b5fE357Eb11c735078e47526D6e853DBff18541',
        decimals: 6,
      },
      celo: {
        address: '0xA41a62567d9eb960D84b72663FdaeBE0BCdE2683',
        decimals: 6,
      },
      solana: {
        address: 'CR4xnGrhsu1fWNPoX4KbTUUtqGMF3mzRLfj4S6YEs1Yo',
        decimals: 6,
      },
      sui: {
        address:
          '0xc3f8927de33d3deb52c282a836082a413bc73c6ee0bd4d7ec7e3b6b4c28e9abf::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xca3a2c28bc8c6c762f752dd2a4ebbfd00356ca99977ce6636e3af5897124a87a::coin::T',
        decimals: 6,
      },
      optimism: {
        address: '0xa6252F56cc6eEA21165d56744C795F91c8a3Cf68',
        decimals: 6,
      },
      base: {
        address: '0xb96B82Cd6D45d98Fb6897D16A5E4EE888329C513',
        decimals: 6,
      },
      fantom: {
        address: '0x2228703672906fEe5eD681Ec28e42B4506b8c336',
        decimals: 6,
      },
    },
  },
  ETHoptimism: {
    key: 'ETHoptimism',
    symbol: 'ETH',
    displayName: 'ETH (Optimism)',
    nativeChain: 'optimism',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#D53424',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHoptimism',
  },
  WETHoptimism: {
    key: 'WETHoptimism',
    symbol: 'WETH',
    displayName: 'WETH (Optimism)',
    nativeChain: 'optimism',
    icon: Icon.ETH,
    tokenId: {
      chain: 'optimism',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#D53424',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      fantom: {
        address: '0xe8E8f941377A955bFA72880ec0dc2319dbC827a8',
        decimals: 18,
      },
      celo: {
        address: '0x8d53771b1Ec7461f8e45Bca2609c45bC0bbd0677',
        decimals: 18,
      },
      solana: {
        address: '8M6d63oL7dvMZ1gNbgGe3h8afMSWJEKEhtPTFM2u8h3c',
        decimals: 8,
      },
      sui: {
        address:
          '0xaab14ec22908de73d1b0619f5e03842398f8e68262981bd35ef44b42d22b23a::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x6a7a7f36ef5e2d0e65fcf72669c20d514d68298b0f76c7554517208f73260aaf::coin::T',
        decimals: 8,
      },
      arbitrum: {
        address: '0xB1fC645a86fB5085e12D8BDDb77702F728D2A26F',
        decimals: 18,
      },
      avalanche: {
        address: '0xDf11535274c0FD2Fe41A88bd1bBF802D72296037',
        decimals: 18,
      },
      bsc: {
        address: '0x94AEc09B5e2CE591e39DC6aa58A3A6E85Ed45265',
        decimals: 18,
      },
      ethereum: {
        address: '0x8B5653Ae095529155462eDa8CF664eD96773F557',
        decimals: 18,
      },
      polygon: {
        address: '0x8182De59485Bb646542Db8C7E5958148Dc699319',
        decimals: 18,
      },
      base: {
        address: '0xCb725aC8d9985D3bE306Dd9e1517d3702929176c',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1ev8rhdflmlq6de5g7ttj585fhuv3jfhnuhfzyh7qrswhzaq2tkqswxz6y3',
        decimals: 8,
      },
      moonbeam: {
        address: '0xd4870F7F5AD8Ae5139E1a5D8AD4ac55204aE4490',
        decimals: 18,
      },
    },
  },
  USDCoptimism: {
    key: 'USDCoptimism',
    symbol: 'USDC',
    nativeChain: 'optimism',
    icon: Icon.USDC,
    tokenId: {
      chain: 'optimism',
      address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      fantom: {
        address: '0x385b219f0C4fa2e84EfE5aaf9692a821C57B8248',
        decimals: 6,
      },
      celo: {
        address: '0xEe48963C003e21EaCEdFA8a0A19BB3cbF7E776Fe',
        decimals: 6,
      },
      moonbeam: {
        address: '0x7143e8EA96e158381057a58AfdDF44601c7e532C',
        decimals: 6,
      },
      base: {
        address: '0xc6bfBeb3002aD563D2d1f72614C61C83Bf147Acd',
        decimals: 6,
      },
      arbitrum: {
        address: '0x3A5C2Da9E30741cb59a5e9446A23A86886fC9DC2',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1snw0qugpjcxwtxzzkqt5guwavq85eumxzeagql2u2m662xrtnjuqyj3pkj',
        decimals: 6,
      },
      aptos: {
        address:
          '0x4f6ecb05a797902d472abc2f5804bde93a53d8b75f14f767824cdb1623a4ee83::coin::T',
        decimals: 6,
      },
      bsc: {
        address: '0xa41ae127D04F7ee73B5058E2C60Fb7c7A2D21F79',
        decimals: 6,
      },
      avalanche: {
        address: '0xBe04f76A0ba2100c3F2d6Aa1FD8484F415469573',
        decimals: 6,
      },
      polygon: {
        address: '0x31F12aCb60C3c32EE884F3894a873347C097D925',
        decimals: 6,
      },
      sui: {
        address:
          '0x6037801f060f0f54b3817bca05e3c8b9b9ffaa2da8e93fd5b80fa662aa3c9e55::coin::COIN',
        decimals: 6,
      },
    },
  },
  // SEI: {
  //   key: 'SEI',
  //   symbol: 'SEI',
  //   nativeChain: 'sei',
  //   tokenId: {
  //     chain: 'sei',
  //     address: 'usei',
  //   },
  //   icon: Icon.SEI,
  //   coinGeckoId: 'sei',
  //   color: '#FFFFFF',
  //   decimals: {
  //     default: 6,
  //   },
  // },
  WETHbsc: {
    key: 'WETHbsc',
    symbol: 'WETH',
    displayName: 'WETH (BSC)',
    nativeChain: 'bsc',
    icon: Icon.ETH,
    tokenId: {
      chain: 'bsc',
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  ETHbase: {
    key: 'ETHbase',
    symbol: 'ETH',
    displayName: 'ETH (Base)',
    nativeChain: 'base',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHbase',
  },
  WETHbase: {
    key: 'WETHbase',
    symbol: 'WETH',
    displayName: 'WETH (Base)',
    nativeChain: 'base',
    icon: Icon.ETH,
    tokenId: {
      chain: 'base',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      ethereum: {
        address: '0x1D4241F7370253C0f12EFC536B7e16E462Fb3526',
        decimals: 18,
      },
      bsc: {
        address: '0x9dc152F4941cE1A138326e70c3600385bf0C22dD',
        decimals: 18,
      },
      polygon: {
        address: '0x5BCf8d8c097FbB35C371F921E3FF3e6F6Eb54B41',
        decimals: 18,
      },
      avalanche: {
        address: '0xFA83178c66fE51ee99109b5cC912f8098Ff812eF',
        decimals: 18,
      },
      fantom: {
        address: '0xd3365E7355230c78098b44B172eE27DAB95B041A',
        decimals: 18,
      },
      celo: {
        address: '0x905CADB645684140E285e2D09D39dF5a2082BC87',
        decimals: 18,
      },
      moonbeam: {
        address: '0x6C6f83366A42fcA4D30a2D3f1914284de995Ac3a',
        decimals: 18,
      },
      solana: {
        address: 'DWXe1hxpnb8LAH21iyXcjvMbiAGzoYyuCVQtRLvZdLYd',
        decimals: 8,
      },
      sui: {
        address:
          '0xaecbc804fa7ca7cffc74c9a05eb6ae86fda0c68375b5c1724204a1065bcb239a::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x5b5f14781164cf77185a7b6acd8e4f3cbb7e7cfb1cd5760d2b8af81075fc153d::coin::T',
        decimals: 8,
      },
      arbitrum: {
        address: '0xBAfbCB010D920e0Dab9DFdcF634De1B777028a85',
        decimals: 18,
      },
      optimism: {
        address: '0x3F369a664fa665e01e8EB9f20bFcE03A0CAb8971',
        decimals: 18,
      },
    },
  },
  USDCbase: {
    key: 'USDCbase',
    symbol: 'USDC',
    nativeChain: 'base',
    icon: Icon.USDC,
    tokenId: {
      chain: 'base',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      solana: {
        address: 'EfqRM8ZGWhDTKJ7BHmFvNagKVu3AxQRDQs8WMMaoBCu6',
        decimals: 6,
      },
      moonbeam: {
        address: '0xE6d02a875CcC153c076fe418f33De3A5C420f505',
        decimals: 6,
      },
      celo: {
        address: '0x2e2acb1782Aad0490f8446b6fD4626C467987bD6',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1edkult6zudk6ld23fesjfrehux35q86engsq5jlycl0e4upkz8mqkgcprf',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/8AC0F990290BBEF3AEBFCBF70F902AD954781BB40D07EB76341272800D48D05F',
        decimals: 6,
      },
      bsc: {
        address: '0x55CaD531c8E303Cab8B3BE4bB4744Db4f896ac81',
        decimals: 6,
      },
      optimism: {
        address: '0xb931c7BbD87A6e249EaA7355B13927F9c99Bce87',
        decimals: 6,
      },
      arbitrum: {
        address: '0x8619F97D4d08382548F536E5CE1D3e0D9bA40326',
        decimals: 6,
      },
      polygon: {
        address: '0x1eeCaB0F75fE93abbFa0cDFfb4fB13d1dC8706c8',
        decimals: 6,
      },
      avalanche: {
        address: '0xab933e939a9236BD439F7d29b87CE712f42bAC06',
        decimals: 6,
      },
      fantom: {
        address: '0xd9E4C283d8A49Dc3767A6F5a4dFdc1d0cEf21604',
        decimals: 6,
      },
      sui: {
        address:
          '0x7e3e74afcc1913aa9491c8cee89b02131a6e5519b090f16b54321835c1241cfb::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xfcc4fcd734d5b8578fb629d238d15264a49eca6165c7444c21feec3b4962eb88::coin::T',
        decimals: 6,
      },
    },
  },
  wstETHbase: {
    key: 'wstETHbase',
    symbol: 'wstETH',
    displayName: 'wstETH (Base)',
    nativeChain: 'base',
    tokenId: {
      chain: 'base',
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  OSMO: {
    key: 'OSMO',
    symbol: 'OSMO',
    nativeChain: 'osmosis',
    tokenId: {
      chain: 'osmosis',
      address: 'uosmo',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'osmosis',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  tBTC: {
    key: 'tBTC',
    symbol: 'tBTC',
    nativeChain: 'ethereum',
    tokenId: {
      chain: 'ethereum',
      address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      polygon: {
        address: '0x3362b2B92b331925F09F9E5bCA3E8C43921a435C',
        decimals: 18,
      },
      fantom: {
        address: '0xeE27799cF29D7F64647B92f47d543B382B49f83E',
        decimals: 18,
      },
      moonbeam: {
        address: '0xeCd65E4B89495Ae63b4f11cA872a23680A7c419c',
        decimals: 18,
      },
      solana: {
        address: '25rXTx9zDZcHyTav5sRqM6YBvTGu9pPH9yv83uAEqbgG',
        decimals: 8,
      },
      sui: {
        address:
          '0xbc3a676894871284b3ccfb2eec66f428612000e2a6e6d23f592ce8833c27c973::coin::COIN',
        decimals: 8,
      },
      base: {
        address: '0x9EE95E6Bd1B3C5740F105d6fb06b8BDeF64Eec70',
        decimals: 18,
      },
      arbitrum: {
        address: '0x57723abc582DBfE11Ea01f1A1f48aEE20bD65D73',
        decimals: 18,
      },
      optimism: {
        address: '0xeC0a755664271b87002dDa33CA2484B24aF68912',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1nu9wf9dw384attnpu0pwfet5fajn05w2ex4r07mghvk3xcwrt2yq5uutp5',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/6207D35D2C08F2162575C3C4BFD524226E50639121A273045F1B393AF67DCEB3',
        decimals: 8,
      },
      avalanche: {
        address: '0x3F531c038A0D2d9c7D19FC3554cd0439791526c4',
        decimals: 18,
      },
      bsc: {
        address: '0x94c97dd3Bde5bC1406BCe82E7941A6365968521D',
        decimals: 18,
      },
      aptos: {
        address:
          '0x9d5a0f8215301fa8096df332b1533f6328f18c32fbac2a7089cfbea73b3068a7::coin::T',
        decimals: 8,
      },
      celo: {
        address: '0xFaED7314060FCEc652ED91D9eac6c980DCA9D3B8',
        decimals: 18,
      },
    },
  },
  tBTCpolygon: {
    key: 'tBTCpolygon',
    symbol: 'tBTC',
    nativeChain: 'polygon',
    tokenId: {
      chain: 'polygon',
      address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      ethereum: {
        address: '0xb4c624dBC50804dA086cf2380cD55dEBC0d22E96',
        decimals: 18,
      },
      optimism: {
        address: '0xE4C32B9eA749fa0342B1C42C01E80028B97c3917',
        decimals: 18,
      },
      arbitrum: {
        address: '0x3bab04bDFd2Dc3640c2B9390A2Da05bC1192D482',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1uj24zecnaxz7ftz0sh6dsayfene4w3yptwg0422kves9duel67vsr7hlyz',
        decimals: 8,
      },
    },
  },
  tBTCoptimism: {
    key: 'tBTCoptimism',
    symbol: 'tBTC',
    nativeChain: 'optimism',
    tokenId: {
      chain: 'optimism',
      address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      ethereum: {
        address: '0xB8d1E0642bFD3744CaBd2ca8830cFabE19b2Ca54',
        decimals: 18,
      },
      polygon: {
        address: '0x68A8797da1c8ED592600d70A5151886A92D2183C',
        decimals: 18,
      },
      arbitrum: {
        address: '0x2519010b6585247BcDC8BcDa5C8730Be754b8c76',
        decimals: 18,
      },
    },
  },
  tBTCarbitrum: {
    key: 'tBTCarbitrum',
    symbol: 'tBTC',
    nativeChain: 'arbitrum',
    tokenId: {
      chain: 'arbitrum',
      address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      base: {
        address: '0x56D0873e0eCA4a56063e1BF945788365666CFBFC',
        decimals: 18,
      },
      celo: {
        address: '0x72878E7d3A8746e0c91b9F16F0b8ee4fDE9DDc06',
        decimals: 18,
      },
      optimism: {
        address: '0x2390a5131fcba6e47f702172cF4876589E4161c6',
        decimals: 18,
      },
      ethereum: {
        address: '0x4F3819A6cfF717BFfE801a75c73A984141c76589',
        decimals: 18,
      },
      polygon: {
        address: '0x045D8c62D5326aa51a31518ECF3aF80C17421Aba',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1q8ynvqvtw49ln73mn70v4me4q03fvvmhkf2lh4ueam5w4362s2asjmvxtd',
        decimals: 8,
      },
    },
  },
  tBTCbase: {
    key: 'tBTCbase',
    symbol: 'tBTC',
    nativeChain: 'base',
    tokenId: {
      chain: 'base',
      address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      ethereum: {
        address: '0x733F28B3e315046Db01dAbC292D6F0F7F26C4551',
        decimals: 18,
      },
    },
  },
  tBTCsol: {
    key: 'tBTCsol',
    symbol: 'tBTC',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  wstETH: {
    key: 'wstETH',
    symbol: 'wstETH',
    nativeChain: 'ethereum',
    tokenId: {
      chain: 'ethereum',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      polygon: {
        address: '0xe082a7Fc696De18172Ad08D956569Ee80BC37f06',
        decimals: 18,
      },
      solana: {
        address: 'ZScHuTtqZukUrtZS43teTKGs2VqkKL8k4QCouR2n6Uo',
        decimals: 8,
      },
      arbitrum: {
        address: '0xf2717122Dfdbe988ae811E7eFB157aAa07Ff9D0F',
        decimals: 18,
      },
      optimism: {
        address: '0x855CFcEEe998c8ca34F9c914F584AbF72dC88B87',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1gg6f95cymcfrfzhpek7cf5wl53t5kng52cd2m0krgdlu8k58vd8qezy8pt',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/BF75AE1500CB7EC458E91A11731F1B6AC1F1FE1FA937A88564955ED6A83CA2FB',
        decimals: 8,
      },
      base: {
        address: '0xEd4e2FD35161c3c0e33cA187fce64C70d44Ce32b',
        decimals: 18,
      },
      bsc: {
        address: '0xad80E1A9B5824234afA9dE1F3bbDb8a994796169',
        decimals: 18,
      },
    },
  },
  wstETHarbitrum: {
    key: 'wstETHarbitrum',
    symbol: 'wstETH',
    displayName: 'wstETH (Arbitrum)',
    nativeChain: 'arbitrum',
    tokenId: {
      chain: 'arbitrum',
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  wstETHoptimism: {
    key: 'wstETHoptimism',
    symbol: 'wstETH',
    displayName: 'wstETH (Optimism)',
    nativeChain: 'optimism',
    tokenId: {
      chain: 'optimism',
      address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  wstETHpolygon: {
    key: 'wstETHpolygon',
    symbol: 'wstETH',
    displayName: 'wstETH (Polygon)',
    nativeChain: 'polygon',
    tokenId: {
      chain: 'polygon',
      address: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD',
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  BONK: {
    key: 'BONK',
    symbol: 'BONK',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    },
    icon: Icon.BONK,
    coinGeckoId: 'bonk',
    color: '#FC8E03',
    decimals: {
      default: 5,
    },
    foreignAssets: {
      ethereum: {
        address: '0x1151CB3d861920e07a38e03eEAd12C32178567F6',
        decimals: 5,
      },
      bsc: {
        address: '0xA697e272a73744b343528C3Bc4702F2565b2F422',
        decimals: 5,
      },
      polygon: {
        address: '0xe5B49820e5A1063F6F4DdF851327b5E8B2301048',
        decimals: 5,
      },
      avalanche: {
        address: '0xC07C98a93591504584738e4569928DDb3b9f12A7',
        decimals: 5,
      },
      sui: {
        address:
          '0x6907963ca849faff0957b9a8269a7a07065e3def2eef49cc33b50ab946ea5a9f::coin::COIN',
        decimals: 5,
      },
      aptos: {
        address:
          '0x2a90fae71afc7460ee42b20ee49a9c9b29272905ad71fef92fbd8b3905a24b56::coin::T',
        decimals: 5,
      },
      arbitrum: {
        address: '0x09199d9A5F4448D0848e4395D065e1ad9c4a1F74',
        decimals: 5,
      },
      wormchain: {
        address:
          'wormhole10qt8wg0n7z740ssvf3urmvgtjhxpyp74hxqvqt7z226gykuus7eq9mpu8u',
        decimals: 5,
      },
      osmosis: {
        address:
          'ibc/CA3733CB0071F480FAE8EF0D9C3D47A49C6589144620A642BBE0D59A293D110E',
        decimals: 5,
      },
      fantom: {
        address: '0x3fEcdF1248fe7642d29f879a75CFC0339659ab93',
        decimals: 5,
      },
      base: {
        address: '0xDF1Cf211D38E7762c9691Be4D779A441a17A6cFC',
        decimals: 5,
      },
      celo: {
        address: '0x3fc50bc066aE2ee280876EeefADfdAbF6cA02894',
        decimals: 5,
      },
    },
  },
  EVMOS: {
    key: 'EVMOS',
    symbol: 'EVMOS',
    nativeChain: 'evmos',
    tokenId: {
      chain: 'evmos',
      address: 'aevmos',
    },
    icon: Icon.EVMOS,
    coinGeckoId: 'evmos',
    color: '#ed4e33',
    decimals: {
      Cosmos: 18,
      Ethereum: 18,
      default: 8,
    },
  },
  KUJI: {
    key: 'KUJI',
    symbol: 'KUJI',
    nativeChain: 'kujira',
    tokenId: {
      chain: 'kujira',
      address: 'ukuji',
    },
    icon: Icon.KUJI,
    coinGeckoId: 'kujira',
    color: '#f51f1e',
    decimals: {
      default: 6,
    },
  },
  PYTH: {
    key: 'PYTH',
    symbol: 'PYTH',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    },
    icon: Icon.PYTH,
    coinGeckoId: 'pyth-network',
    color: '#E6DAFE',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      aptos: {
        address:
          '0x770211b47954e15bec1a4271bf33bacebc2d2adb43b7dc1ca45efa787615dd4c::coin::T',
        decimals: 6,
      },
      bsc: {
        address: '0xb0188B0bb2cD4a6D2744637fC83C94a284B247Da',
        decimals: 6,
      },
      base: {
        address: '0x4c5d8A75F3762c1561D96f177694f67378705E98',
        decimals: 6,
      },
      celo: {
        address: '0x985aa4814419ba338379A634785216301e51113D',
        decimals: 6,
      },
      avalanche: {
        address: '0x8A0691e602B7a5FCc51a27E4a08376dE50889B42',
        decimals: 6,
      },
      polygon: {
        address: '0xFa4B761A1e07909Ba31331a5dfa12390E3ff5583',
        decimals: 6,
      },
      fantom: {
        address: '0x77ad3B2dA29FBd208F12c3C701E969F4422aAD79',
        decimals: 6,
      },
      optimism: {
        address: '0x99C59ACeBFEF3BBFB7129DC90D1a11DB0E91187f',
        decimals: 6,
      },
      ethereum: {
        address: '0xeFc0CED4B3D536103e76a1c4c74F0385C8F4Bdd3',
        decimals: 6,
      },
      arbitrum: {
        address: '0xE4D5c6aE46ADFAF04313081e8C0052A30b6Dd724',
        decimals: 6,
      },
      sui: {
        address:
          '0x9c6d76eb273e6b5ba2ec8d708b7fa336a5531f6be59f326b5be8d4d8b12348a4::coin::COIN',
        decimals: 6,
      },
    },
  },
};
