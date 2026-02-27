import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  return { ...auth, dispatch };
};

export const useStories = () => {
  const stories = useAppSelector((state) => state.stories);
  const dispatch = useAppDispatch();
  return { ...stories, dispatch };
};
