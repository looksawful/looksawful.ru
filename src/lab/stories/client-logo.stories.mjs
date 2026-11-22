import { clientLogos } from "../../data/clients.ts";
import { renderClientLogo } from "../../templates/client-logo.ts";

const logo = clientLogos[0];

const meta = {
  title: "01 Atoms/Client Logo",
  tags: ["autodocs"],
  render: () => renderClientLogo(logo),
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Uses the canonical client logo data and src/templates/client-logo.ts renderer without duplicating production markup or CSS.",
      },
    },
  },
};

export default meta;

export const Default = {};
