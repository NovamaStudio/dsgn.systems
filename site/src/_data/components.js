// All components for the generated pages and the overview (see site/lib/components.js).
import { list, byGroup } from "../../lib/components.js";

// count: the components a visitor can pick, without the base styles and the layout primitives
export default {
  list,
  byGroup,
  count: list.filter((c) => c.group !== "Layout" && c.key !== "base").length,
};
