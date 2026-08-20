<div align="center">
  <img src="./assets/images/app-icon.png" width="112" alt="Duck Routine app icon" />

  # Duck Routine

  ### 오늘을 가볍게 시작하도록 돕는, 작은 단계의 루틴 앱

  <p>
    <img src="https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React Native" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

## 소개

**Duck Routine**은 막막한 일을 아주 작은 행동 단위로 나누어, 부담 없이 첫걸음을 뗄 수 있도록 돕는 앱입니다. 오늘 할 일을 일정으로 등록하고, 단계별 타이머를 따라가며 하나씩 완료할 수 있습니다.

> 완벽하게 해내는 것보다, 지금 가볍게 시작하는 데 집중합니다.

## 주요 기능

- **작은 단계의 루틴** — 일상에서 바로 쓸 수 있는 기본 루틴과 나만의 루틴을 제공합니다.
- **일정과 반복 설정** — 특정 날짜, 요일, 기간을 기준으로 루틴을 계획하고 알림을 받을 수 있습니다.
- **단계별 진행 타이머** — 각 행동에 집중할 시간을 설정하고, 루틴을 끝까지 이어갈 수 있습니다.
- **루틴 관리** — 루틴 생성·수정·삭제, 즐겨찾기, 기본 루틴 표시/숨김을 지원합니다.
- **활동 기록** — 완료 횟수, 연속 일수, 누적 완료 시간과 일별 활동 차트를 확인할 수 있습니다.
- **앱 내 알림 센터** — 일정 알림과 안내 메시지를 앱 안에서도 확인할 수 있습니다.
- **로컬 우선 저장** — 루틴, 일정, 기록, 사용자 설정은 기기 내부에 저장됩니다.

## 화면 구성

| 홈 | 일정 | 루틴 관리 | 내 정보 |
| --- | --- | --- | --- |
| 오늘의 일정·즐겨찾는 루틴을 빠르게 시작합니다. | 달력에서 일정과 반복 시간을 관리합니다. | 나만의 루틴을 만들고 기본 루틴을 관리합니다. | 활동 기록, 프로필, 앱 설정을 확인합니다. |

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Framework | Expo, React Native, TypeScript |
| Navigation | Expo Router |
| State & Storage | Context API, AsyncStorage |
| UI & Interaction | Reanimated, Gesture Handler, Gorhom Bottom Sheet, SVG |
| Notifications | Expo Notifications |
| Charts | react-native-gifted-charts |
| Ads | Google Mobile Ads |

## 프로젝트 구조

Feature-Sliced Design의 개념을 바탕으로 화면, 기능, 엔티티, 공용 모듈을 분리했습니다.

```text
src/
├── app/          # Expo Router 라우트와 앱 전역 레이아웃
├── pages/        # 화면 단위 UI
├── widgets/      # 여러 기능을 조합한 독립 UI 블록
├── features/     # 사용자 행동 중심의 기능
├── entities/     # 루틴, 사용자, 알림 도메인 모델
├── shared/       # 공용 UI, 설정, 유틸리티
└── types/        # 공용 타입 선언
```

## 개인정보 및 약관

- [개인정보처리방침](https://app.notion.com/p/3bd733a4048f80f9bd45eaa7fa79c261?source=copy_link)
- [이용약관](https://app.notion.com/p/3bd733a4048f805c9aaeec5ac16ec45b?source=copy_link)

## 문의

문의: [wnsdl240@gmail.com](mailto:wnsdl240@gmail.com)

---

<div align="center">
  작은 시작이 쌓여, 오늘을 바꿉니다. 🦆
</div>
