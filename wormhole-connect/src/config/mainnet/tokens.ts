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
    },
  },
  USDCpolygon: {
    key: 'USDCpolygon',
    symbol: 'USDC',
    nativeChain: 'polygon',
    icon: Icon.USDC,
    tokenId: {
      chain: 'polygon',
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      ethereum: {
        address: '0x566957eF80F9fd5526CD2BEF8BE67035C0b81130',
        decimals: 6,
      },
      bsc: {
        address: '0x672147dD47674757C457eB155BAA382cc10705Dd',
        decimals: 6,
      },
      avalanche: {
        address: '0x543672E9CBEC728CBBa9C3Ccd99ed80aC3607FA8',
        decimals: 6,
      },
      fantom: {
        address: '0x6e0e8cf6Ad151e1260A4D398faaEDFC450A9f00a',
        decimals: 6,
      },
      celo: {
        address: '0x0E21B5BdFb6eDBa7d903a610d4DE2F8c72586017',
        decimals: 6,
      },
      moonbeam: {
        address: '0x530E29eD727800e04bCd28B588775D50DE59097C',
        decimals: 6,
      },
      solana: {
        address: 'E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M',
        decimals: 6,
      },
      sui: {
        address:
          '0xcf72ec52c0f8ddead746252481fb44ff6e8485a39b803825bde6b00d77cdb0bb::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xc7160b1c2415d19a88add188ec726e62aab0045f0aed798106a2ef2994a9101e::coin::T',
        decimals: 6,
      },
      arbitrum: {
        address: '0x9A3Fba8a0870Fb9765023681DAa5390C7919C916',
        decimals: 6,
      },
      optimism: {
        address: '0x8ab72605E48C1f70A20BdD2B3A217FEc24d777f9',
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
      default: 18,
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
      default: 18,
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
      default: 18,
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
      default: 18,
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
};
