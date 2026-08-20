import { Routine } from './types';

const step = (id: string, title: string, durationSec = 60) => ({ id, title, durationSec });

export const starterRoutineHistoryIds = new Set([
  'woke-up',
  'dont-want-to',
  'not-sure-what-to-do',
  'phone-scroll',
  'start-work',
  'lost-focus',
  'messy-home',
  'dont-want-to-shower',
  'need-to-leave',
  'need-to-sleep',
]);

export const starterRoutines: Routine[] = [
  {
    id: 'woke-up',
    title: '아침 준비를 시작해요',
    icon: '🌅',
    description: '침대에서 나와 하루를 시작해요.',
    steps: [
      step('wu1', '몸을 일으켜 침대에서 나오기', 30),
      step('wu2', '커튼이나 창문 열기', 30),
      step('wu3', '물 한 잔 마시기'),
      step('wu4', '세수하기', 180),
      step('wu5', '양치하기', 180),
      step('wu6', '오늘 입을 옷으로 갈아입기', 180),
    ],
  },
  {
    id: 'start-work',
    title: '일·공부를 시작해요',
    icon: '💻',
    description: '시작할 환경부터 가볍게 만들어요.',
    steps: [
      step('sw1', '오늘 할 일 하나만 고르기'),
      step('sw2', '책상 위 필요한 공간 만들기', 120),
      step('sw3', '물이나 음료 준비하기'),
      step('sw4', '폰을 무음으로 하고 손에서 치우기', 30),
      step('sw5', '필요한 화면이나 책 열기'),
      step('sw6', '10분만 시작하기', 600),
    ],
  },
  {
    id: 'lost-focus',
    title: '집중을 다시 잡아요',
    icon: '🎧',
    description: '하던 일의 다음 행동부터 이어가요.',
    steps: [
      step('lf1', '하던 일이 무엇인지 확인하기', 30),
      step('lf2', '방해되는 화면과 알림 닫기', 30),
      step('lf3', '다음에 할 행동 하나 정하기'),
      step('lf4', '필요한 것만 화면에 남기기', 30),
      step('lf5', '5분 동안 다시 집중하기', 300),
    ],
  },
  {
    id: 'messy-home',
    title: '10분만 정리해요',
    icon: '🧹',
    description: '눈에 보이는 것부터 짧게 정리해요.',
    steps: [
      step('mh1', '쓰레기부터 한곳에 모으기', 120),
      step('mh2', '컵과 그릇을 싱크대로 옮기기', 120),
      step('mh3', '벗어둔 옷을 한곳에 모으기', 120),
      step('mh4', '바닥에 있는 물건 제자리로 옮기기', 180),
      step('mh5', '책상이나 테이블 한 곳 닦기', 60),
    ],
  },
  {
    id: 'dont-want-to-shower',
    title: '씻을 준비를 해요',
    icon: '🚿',
    description: '준비물부터 챙기면 시작하기 쉬워져요.',
    steps: [
      step('ds1', '수건과 갈아입을 옷 준비하기'),
      step('ds2', '화장실로 이동하기', 30),
      step('ds3', '물을 틀고 온도 맞추기', 30),
      step('ds4', '샤워하기', 600),
      step('ds5', '몸을 닦고 옷 입기', 180),
    ],
  },
  {
    id: 'need-to-leave',
    title: '외출 준비를 해요',
    icon: '🚪',
    description: '나가기 전 필요한 것만 차례로 챙겨요.',
    steps: [
      step('nl1', '출발할 시간 확인하기', 30),
      step('nl2', '세수하고 양치하기', 300),
      step('nl3', '외출할 옷 입기', 180),
      step('nl4', '머리 정리하기', 180),
      step('nl5', '가방에 필요한 물건 챙기기', 180),
      step('nl6', '폰·지갑·열쇠 확인하기', 30),
      step('nl7', '신발 신고 나가기'),
    ],
  },
  {
    id: 'need-to-sleep',
    title: '잠자리에 들 준비를 해요',
    icon: '🌙',
    description: '하루를 정리하고 편하게 누워요.',
    steps: [
      step('sl1', '내일 알람 맞추기', 30),
      step('sl2', '폰을 충전기에 연결하기', 30),
      step('sl3', '세수하고 양치하기', 300),
      step('sl4', '방 조명을 어둡게 하기', 30),
      step('sl5', '침대에 눕기', 30),
      step('sl6', '폰을 손이 닿지 않는 곳에 두기', 30),
    ],
  },
];
