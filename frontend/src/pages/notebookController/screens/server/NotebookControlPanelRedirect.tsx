import * as React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ApplicationsPage from '../../../../pages/ApplicationsPage';
import {
  useCheckJupyterEnabled,
  usernameTranslate,
} from '../../../../utilities/notebookControllerUtils';
import { NotebookControllerContext } from '../../NotebookControllerContext';
import { useUser } from '../../../../redux/selectors';
import { NotebookControllerTabTypes } from '../../const';

const NotebookControlPanelRedirect: React.FC = () => {
  const history = useHistory();
  const { username: translatedUsername } = useParams<{ username: string }>();
  const { username: loggedInUser, isAdmin } = useUser();
  const translatedLoggedInUsername = usernameTranslate(loggedInUser);
  const { setImpersonating, setCurrentAdminTab } = React.useContext(NotebookControllerContext);
  const isJupyterEnabled = useCheckJupyterEnabled();

  React.useEffect(() => {
    if (translatedLoggedInUsername && translatedUsername && isJupyterEnabled) {
      const notActiveUser = translatedLoggedInUsername !== translatedUsername;
      if (notActiveUser) {
        if (isAdmin) {
          // TODO: we need to worry about this case -- how to manage it?
          // setImpersonating(undefined, translatedUsername);
          setCurrentAdminTab(NotebookControllerTabTypes.ADMIN);
          history.replace('/notebookController');
          return;
        }

        // Invalid state -- cannot view others notebook as not admin
        history.push('/not-found');
        return;
      }

      // Logged in user -- just redirect and it will load the state normally
      history.replace('/notebookController');
    }
  }, [
    translatedUsername,
    isJupyterEnabled,
    history,
    translatedLoggedInUsername,
    isAdmin,
    setImpersonating,
    setCurrentAdminTab,
  ]);
  return (
    <ApplicationsPage title="Redirecting..." description={null} loaded={false} empty={false} />
  );
};

export default NotebookControlPanelRedirect;
