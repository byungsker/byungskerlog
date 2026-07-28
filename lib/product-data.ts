export interface ProductLink {
  label: string;
  href: string;
  storefrontNote?: string;
}

export interface ProductImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface ProductFeature {
  title: string;
  description: string;
}

export interface Product {
  slug: "bookgolas" | "baroguni";
  name: string;
  localizedName: string;
  problem: string;
  origin: string;
  publicStatus: string;
  previousApproach: string;
  productReason: string;
  actualUse: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  logo: ProductImage;
  images: ProductImage[];
  features: ProductFeature[];
  officialLinks: ProductLink[];
  relatedPosts: Array<{
    title: string;
    href: string;
  }>;
}

export interface LegacyProject {
  name: string;
  description: string;
  href: string;
  category: "Web" | "NPM" | "App";
}

export const companyProducts: Product[] = [
  {
    slug: "bookgolas",
    name: "Bookgolas",
    localizedName: "북골라스",
    problem: "독서 목표, 진행 상황, 메모와 하이라이트가 흩어지면 읽는 흐름을 꾸준히 이어가기 어렵습니다.",
    origin: "읽을 책과 목표, 페이지 기록을 한곳에서 관리하고 싶어 만든 독서 기록 앱입니다.",
    publicStatus: "iPhone 앱 공개 중",
    previousApproach: "읽을 책과 목표일은 따로 정하고, 읽은 페이지와 떠오른 생각은 여러 메모에 나누어 기록했습니다.",
    productReason:
      "책을 고르는 순간부터 읽는 과정과 나중에 다시 떠올리는 순간까지 하나의 흐름으로 이어 보기 위해 제품으로 만들었습니다.",
    actualUse:
      "읽을 책과 목표일을 정하고, 읽는 동안 페이지·메모·하이라이트를 남깁니다. 진행률을 확인하고 기록을 검색해 다시 꺼내 봅니다.",
    description: "독서 목표, 진행 상황, 메모와 하이라이트를 한곳에서 관리하는 독서 기록 앱입니다.",
    applicationCategory: "BookApplication",
    operatingSystem: "iOS",
    logo: {
      src: "/products/bookgolas/logo.png",
      alt: "Bookgolas 앱 아이콘",
      caption: "Bookgolas",
      width: 600,
      height: 600,
    },
    images: [
      {
        src: "/products/bookgolas/reading-progress.png",
        alt: "Bookgolas에서 목표일, 독서 진행률과 페이지 기록을 확인하는 화면",
        caption: "목표일과 진행률, 독서 기록을 한 화면에서 확인합니다.",
        width: 838,
        height: 1796,
      },
    ],
    features: [
      {
        title: "목표와 진행률",
        description: "목표일과 남은 분량을 기준으로 오늘 읽을 양과 전체 진행률을 확인합니다.",
      },
      {
        title: "페이지별 독서 기록",
        description: "읽은 페이지와 함께 메모, 하이라이트와 이미지를 남겨 독서 과정을 이어갑니다.",
      },
      {
        title: "내 기록 검색",
        description: "남겨 둔 독서 기록에서 질문과 관련된 내용을 다시 찾아봅니다.",
      },
    ],
    officialLinks: [
      {
        label: "공식 사이트",
        href: "https://book-golas.vercel.app/",
      },
      {
        label: "App Store",
        href: "https://apps.apple.com/kr/app/bookgolas-ai-%EB%8F%85%EC%84%9C-%EA%B4%80%EB%A6%AC/id6757021809",
      },
    ],
    relatedPosts: [],
  },
  {
    slug: "baroguni",
    name: "Baroguni",
    localizedName: "바로구니",
    problem: "장보기 부탁이 카톡과 메모에 흩어지면 필요한 물건을 빠뜨리거나 같은 물건을 두 번 사기 쉽습니다.",
    origin: "함께 장볼 때 서로 다른 목록을 확인하던 불편을 하나의 공유 장바구니로 줄이려고 만들었습니다.",
    publicStatus: "iPhone 앱 공개 중",
    previousApproach:
      "필요한 물건을 각자 메모하고 카톡으로 다시 전달한 뒤, 마트에서 메시지를 오가며 산 물건을 확인했습니다.",
    productReason:
      "누가 무엇을 부탁했고 무엇을 샀는지 같은 목록에서 바로 확인해 장보기 누락과 중복을 줄이기 위해 제품으로 만들었습니다.",
    actualUse:
      "장바구니를 만들고 가족이나 친구를 초대합니다. 필요한 물건을 함께 추가하고 산 물건을 체크한 뒤 완료한 목록과 영수증 기록을 다시 봅니다.",
    description: "가족이나 친구와 필요한 물건을 함께 추가하고 산 물건을 체크하는 공유 장보기 앱입니다.",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "iOS 15.0 or later",
    logo: {
      src: "/products/baroguni/logo.svg",
      alt: "바로구니 앱 아이콘",
      caption: "바로구니",
      width: 72,
      height: 72,
    },
    images: [
      {
        src: "/products/baroguni/cart-detail.jpg",
        alt: "바로구니에서 장보기 품목과 가격을 함께 확인하는 화면",
        caption: "필요한 물건과 산 물건, 기록한 가격을 같은 목록에서 확인합니다.",
        width: 1284,
        height: 2778,
      },
    ],
    features: [
      {
        title: "실시간 공유 장바구니",
        description: "가족이나 친구를 초대해 같은 장보기 목록에 항목을 추가하고 완료 상태를 확인합니다.",
      },
      {
        title: "영수증 스캔",
        description: "카메라나 사진에서 영수증을 인식해 구입한 항목과 가격을 정리합니다.",
      },
      {
        title: "보관함과 장보기 기록",
        description: "완료한 장바구니와 지난 영수증 기록을 다음 장보기에 참고합니다.",
      },
    ],
    officialLinks: [
      {
        label: "공식 사이트",
        href: "https://baroguni.vercel.app/",
      },
      {
        label: "App Store",
        href: "https://apps.apple.com/kr/app/%EB%B0%94%EB%A1%9C%EA%B5%AC%EB%8B%88/id6759001341",
      },
    ],
    relatedPosts: [],
  },
];

export const legacyProjects: LegacyProject[] = [
  {
    name: "JSON Animation Viewer",
    description: "JSON 애니메이션을 실시간으로 미리보고 편집할 수 있는 웹 뷰어",
    href: "https://json-animation-viewer.vercel.app/",
    category: "Web",
  },
  {
    name: "Figmable",
    description: "Figma 변수를 가져와 CSS를 갱신하는 CLI 도구",
    href: "https://www.npmjs.com/package/figmable",
    category: "NPM",
  },
  {
    name: "Bridge-zip",
    description: "Windows와 macOS 사이에서 zip 파일 호환을 돕는 CLI 도구",
    href: "https://www.npmjs.com/package/bridge-zip",
    category: "NPM",
  },
  {
    name: "markyfy",
    description: "구문 강조를 지원하는 유연한 마크다운 파서",
    href: "https://www.npmjs.com/package/markyfy",
    category: "NPM",
  },
  {
    name: "꾸깃",
    description: "꾸준한 습관 형성을 돕는 서비스",
    href: "https://ggugitt.com/",
    category: "App",
  },
  {
    name: "오키나와",
    description: "여행 정보와 가이드를 제공하는 서비스",
    href: "https://www.oknawa.com/",
    category: "App",
  },
];

export function getProductBySlug(slug: string) {
  return companyProducts.find((product) => product.slug === slug);
}
